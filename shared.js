// === shared.js: Gemeinsam genutzte Klassen fuer alle Spiele ===

// === SharedAudio: Zentrales AudioContext-Management ===
class SharedAudio {
    static _ctx = null;
    static getContext() {
        if (!SharedAudio._ctx || SharedAudio._ctx.state === 'closed') {
            SharedAudio._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return SharedAudio._ctx;
    }
    static playTone(frequency, duration, type = 'sine', volume = 0.3) {
        const ctx = SharedAudio.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = type;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }
    static playStartSound() {
        try {
            const ctx = SharedAudio.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 740;
            gain.gain.value = 0.18;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.18);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
            osc.stop(ctx.currentTime + 0.22);
        } catch(e) {}
    }
    static playSuccessMelody() {
        // Alle Toene vorab auf der Audio-Clock schedulen, damit sie auch bei
        // Main-Thread-Blocking (z.B. Piper-WASM-Synthese parallel) sauber in
        // "duedueduemm" abgespielt werden und nicht abgehackt klingen.
        const ctx = SharedAudio.getContext();
        if (ctx.state === 'suspended') { try { ctx.resume(); } catch(e) {} }
        const notes = [523, 659, 784, 1047];
        const t0 = ctx.currentTime;
        const duration = 0.2;
        const volume = 0.3;
        notes.forEach((freq, i) => {
            const when = t0 + i * 0.15;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, when);
            gain.gain.exponentialRampToValueAtTime(0.01, when + duration);
            osc.start(when);
            osc.stop(when + duration);
        });
    }
    static playWrongSound() {
        const ctx = SharedAudio.getContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.frequency.linearRampToValueAtTime(280, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
    }
}

// === TTSManager: Text-to-Speech ===
class TTSManager {
    constructor() {}
    async speak(text) {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                this._waitAndSpeak(text, 0, resolve);
            } else {
                resolve();
            }
        });
    }
    _waitAndSpeak(text, tries = 0, onEnd = null) {
        if (tries > 20) {
            window.speechSynthesis.cancel();
            if (onEnd) onEnd();
            return;
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            setTimeout(() => this._waitAndSpeak(text, tries + 1, onEnd), 100);
        } else {
            this._speakNow(text, onEnd);
        }
    }
    _speakNow(text, onEnd = null) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        // Langsamer fuer Vorschulkinder: kuerzere Hoer-Pausen, damit der
        // Anfangslaut noch im Gedaechtnis ist, wenn die Frage endet.
        utterance.rate = 0.75;
        utterance.pitch = 1.1;
        utterance.onend = () => { if (onEnd) onEnd(); };
        utterance.onerror = () => { window.speechSynthesis.cancel(); if (onEnd) onEnd(); };
        speechSynthesis.speak(utterance);
    }
}

// === PiperTTSManager: lokales, hochqualitatives TTS via Piper + Thorsten ===
// Laedt das Modell beim ersten Start von Hugging Face (~63MB) und cached es
// via OPFS. Bis das Modell bereit ist oder falls etwas scheitert, wird
// transparent auf den SpeechSynthesis-TTSManager zurueckgefallen.

// Google Chirp 3 HD Stimmen fuer de-DE. Namen nach Mond/Stern-Konvention.
const GOOGLE_CHIRP_VOICES = [
    { id: 'de-DE-Chirp3-HD-Leda',    label: 'Leda (weiblich, warm)' },
    { id: 'de-DE-Chirp3-HD-Aoede',   label: 'Aoede (weiblich, klar)' },
    { id: 'de-DE-Chirp3-HD-Kore',    label: 'Kore (weiblich, freundlich)' },
    { id: 'de-DE-Chirp3-HD-Charon',  label: 'Charon (männlich, ruhig)' },
    { id: 'de-DE-Chirp3-HD-Puck',    label: 'Puck (männlich, energisch)' },
    { id: 'de-DE-Chirp3-HD-Orus',    label: 'Orus (männlich, sonor)' },
];

class PiperTTSManager {
    static _shared = null;
    static getShared(voiceId = 'de_DE-thorsten-medium') {
        if (!PiperTTSManager._shared) {
            PiperTTSManager._shared = new PiperTTSManager(voiceId);
            window._sharedTTS = PiperTTSManager._shared;
        }
        return PiperTTSManager._shared;
    }
    constructor(voiceId = 'de_DE-thorsten-medium') {
        this.voiceId = voiceId;
        this.fallback = new TTSManager();
        this.ready = false;
        this.enabled = true; // kann per Eltern-Menue deaktiviert werden
        this.progress = 0;   // 0..1 Modell-Download-Fortschritt
        this.status = 'init'; // init | downloading | ready | fallback (gilt nur fuer piper-Backend)
        this._currentAudio = null;
        // WebAudio-BufferSource der laufenden Ansage. iOS Safari blockiert
        // HTMLAudioElement.play(), wenn der Call nach asynchroner WASM-
        // Inferenz ausserhalb des User-Gesture-Fensters landet. Der Shared-
        // AudioContext ist beim ersten Tap (Spielstart) bereits entsperrt,
        // darum spielen wir TTS primaer darueber ab.
        this._currentSource = null;
        // Queue-Semantik: speak() reiht neue Ansagen hinter die laufende ein,
        // statt sie zu ueberlappen. cancel() setzt den Cancel-Marker auf die
        // aktuelle Generation, wodurch sowohl laufende als auch wartende
        // Ansagen abbrechen - noetig wenn das Kind tippt oder eine neue
        // Aufgabe startet.
        this._speakGen = 0;
        this._cancelGen = 0;
        this._currentSpeak = null;
        // Backend-Wahl: 'piper' (default, lokal) | 'google' (Chirp 3 HD, API-Key) | 'browser'
        this.backend = this._loadSetting('tts-backend', 'piper');
        this.googleKey = this._loadSetting('google-tts-key', '');
        this.googleVoice = this._loadSetting('google-tts-voice', 'de-DE-Chirp3-HD-Leda');
        this.googleStatus = this.googleKey ? 'ready' : 'no-key'; // ready | no-key | error
        this.initPromise = this._init();
    }
    _loadSetting(k, def) {
        try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; }
    }
    _saveSetting(k, v) {
        try { localStorage.setItem(k, v); } catch (e) {}
    }
    setBackend(b) {
        if (!['piper', 'google', 'browser'].includes(b)) return;
        this.backend = b;
        this._saveSetting('tts-backend', b);
    }
    setGoogleKey(k) {
        this.googleKey = (k || '').trim();
        this._saveSetting('google-tts-key', this.googleKey);
        this.googleStatus = this.googleKey ? 'ready' : 'no-key';
    }
    setGoogleVoice(v) {
        this.googleVoice = v || 'de-DE-Chirp3-HD-Leda';
        this._saveSetting('google-tts-voice', this.googleVoice);
    }
    async _waitForPiperModule(timeoutMs = 5000) {
        if (window._piper) return true;
        return new Promise((resolve) => {
            const t = setTimeout(() => { window.removeEventListener('piper-ready', onReady); resolve(false); }, timeoutMs);
            const onReady = () => { clearTimeout(t); resolve(true); };
            window.addEventListener('piper-ready', onReady, { once: true });
        });
    }
    async _init() {
        const loaded = await this._waitForPiperModule();
        if (!loaded) { this.status = 'fallback'; return; }
        try {
            this.status = 'downloading';
            await window._piper.download(this.voiceId, (p) => {
                if (p && p.total) this.progress = p.loaded / p.total;
            });
            this.ready = true;
            this.status = 'ready';
        } catch (e) {
            console.warn('[PiperTTS] Modell konnte nicht geladen werden, Fallback aktiv:', e);
            this.status = 'fallback';
        }
    }
    speak(text) {
        const myGen = ++this._speakGen;
        const prev = this._currentSpeak;
        const task = (async () => {
            try { if (prev) await prev; } catch (e) {}
            if (this._cancelGen >= myGen) return;
            await this._speakImmediate(text, myGen);
        })();
        this._currentSpeak = task;
        task.finally(() => {
            if (this._currentSpeak === task) this._currentSpeak = null;
        });
        return task;
    }
    cancel() {
        this._cancelGen = this._speakGen;
        this._stop();
    }
    async _speakImmediate(text, myGen) {
        if (!this.enabled || this.backend === 'browser') {
            return this.fallback.speak(text);
        }
        if (this.backend === 'google') {
            return this._speakGoogle(text, myGen);
        }
        if (!this.ready) return this.fallback.speak(text);
        try {
            const wav = await Promise.race([
                window._piper.predict({ text, voiceId: this.voiceId }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('piper-timeout')), 4000))
            ]);
            if (this._cancelGen >= myGen) return;
            const arrayBuffer = await wav.arrayBuffer();
            if (this._cancelGen >= myGen) return;
            // Piper-Thorsten spricht fuer Vorschulkinder etwas zu schnell.
            // playbackRate 0.9 senkt leicht die Tonhoehe - ok fuer maennliche
            // Stimme. WebAudio unterstuetzt kein preservesPitch, das ist der
            // Preis fuer iOS-Kompatibilitaet.
            return await this._playViaWebAudio(arrayBuffer, 0.9, myGen);
        } catch (e) {
            console.warn('[PiperTTS] Synthese fehlgeschlagen, Fallback:', e);
            return this.fallback.speak(text);
        }
    }
    async _speakGoogle(text, myGen) {
        if (!this.googleKey) { this.googleStatus = 'no-key'; return this.fallback.speak(text); }
        try {
            const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(this.googleKey)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: 'de-DE', name: this.googleVoice },
                    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 0 }
                })
            });
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                console.warn('[GoogleTTS] HTTP', res.status, body.slice(0, 200));
                this.googleStatus = 'error';
                return this.fallback.speak(text);
            }
            const data = await res.json();
            if (!data.audioContent) { this.googleStatus = 'error'; return this.fallback.speak(text); }
            if (this._cancelGen >= myGen) return;
            this.googleStatus = 'ready';
            // Base64-MP3 in ArrayBuffer umwandeln und ueber WebAudio abspielen.
            // Google liefert schon mit speakingRate: 0.85, daher playbackRate 1.
            const binary = atob(data.audioContent);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return await this._playViaWebAudio(bytes.buffer, 1, myGen);
        } catch (e) {
            console.warn('[GoogleTTS] Fehler:', e);
            this.googleStatus = 'error';
            return this.fallback.speak(text);
        }
    }
    // Decodiert einen Audio-ArrayBuffer (WAV/MP3) ueber den geteilten
    // AudioContext und spielt ihn ueber eine BufferSource ab. iOS Safari
    // erlaubt WebAudio-Playback, sobald der Context einmal ueber eine
    // Nutzer-Geste entsperrt wurde - die Piper-Inferenz-Latenz ist damit
    // unkritisch, weil wir keinen HTMLAudioElement.play() im Gesture-Block
    // brauchen.
    async _playViaWebAudio(arrayBuffer, playbackRate, myGen) {
        const ctx = SharedAudio.getContext();
        if (ctx.state === 'suspended') {
            try { await ctx.resume(); } catch (e) {}
        }
        // Safari unterstuetzt sowohl die callback- als auch die promise-
        // basierte decodeAudioData-Signatur; wir rufen die Callback-Variante
        // auf und wrappen sie selbst in ein Promise, damit aeltere iOS-
        // Versionen nicht an der fehlenden Promise-Rueckgabe scheitern.
        const audioBuffer = await new Promise((resolve, reject) => {
            try {
                const p = ctx.decodeAudioData(arrayBuffer, resolve, reject);
                if (p && typeof p.then === 'function') p.then(resolve, reject);
            } catch (e) { reject(e); }
        });
        if (this._cancelGen >= myGen) return;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        if (playbackRate && playbackRate !== 1) {
            try { source.playbackRate.value = playbackRate; } catch (e) {}
        }
        source.connect(ctx.destination);
        this._currentSource = source;
        return new Promise((resolve) => {
            let done = false;
            const cleanup = () => {
                if (done) return;
                done = true;
                if (this._currentSource === source) this._currentSource = null;
                try { source.disconnect(); } catch (e) {}
                resolve();
            };
            source.onended = cleanup;
            try { source.start(0); } catch (e) { cleanup(); }
        });
    }
    _stop() {
        if (this._currentAudio) {
            try { this._currentAudio.pause(); } catch (e) {}
            this._currentAudio = null;
        }
        if (this._currentSource) {
            try { this._currentSource.onended = null; } catch (e) {}
            try { this._currentSource.stop(0); } catch (e) {}
            try { this._currentSource.disconnect(); } catch (e) {}
            this._currentSource = null;
        }
        if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }
    }
    setEnabled(v) { this.enabled = !!v; }
}

// === MusicManager: Musiksteuerung ===
class MusicManager {
    constructor(tracks, covers) {
        this.musicTracks = tracks;
        this.covers = covers;
        this.backgroundMusic = null;
        this.musicEnabled = true;
        // Default leiser, damit TTS-Sprecher darueber gut hoerbar bleibt.
        // Persistiert ueber localStorage.
        this.volume = this._loadVolume();
    }
    _loadVolume() {
        try {
            const v = localStorage.getItem('music-volume');
            if (v !== null) {
                const n = parseFloat(v);
                if (!Number.isNaN(n) && n >= 0 && n <= 1) return n;
            }
        } catch (e) {}
        return 0.25;
    }
    setVolume(v) {
        v = Math.max(0, Math.min(1, v));
        this.volume = v;
        if (this.backgroundMusic) this.backgroundMusic.volume = v;
        try { localStorage.setItem('music-volume', String(v)); } catch (e) {}
    }
    playBackgroundMusic() {
        if (!this.musicEnabled) return;
        if (!this.backgroundMusic) {
            const randomIndex = Math.floor(Math.random() * this.musicTracks.length);
            const track = this.musicTracks[randomIndex];
            this.backgroundMusic = new Audio(track);
            this.backgroundMusic.loop = false;
            this.backgroundMusic.volume = this.volume;
            this.backgroundMusic.preload = 'auto';
            this.backgroundMusic.onended = () => {
                this.nextTrack();
            };
        }
        this.backgroundMusic.play().catch(()=>{});
        this._updateMusicButton();
    }
    stopBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
    }
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this._updateMusicButton();
        if (this.musicEnabled) {
            if (this.backgroundMusic) {
                this.backgroundMusic.play().catch(()=>{});
            } else {
                this.playBackgroundMusic();
            }
        } else {
            this.stopBackgroundMusic();
        }
    }
    selectTrack(idx) {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic = null;
        }
        const track = this.musicTracks[idx];
        this.backgroundMusic = new Audio(track);
        this.backgroundMusic.loop = false;
        this.backgroundMusic.volume = this.volume;
        this.backgroundMusic.preload = 'auto';
        this.backgroundMusic.onended = () => {
            this.nextTrack();
        };
        this.backgroundMusic.play().catch(()=>{});
        this.musicEnabled = true;
        this._updateMusicButton();
    }
    prevTrack() {
        if (!this.backgroundMusic) return;
        const currentFile = decodeURIComponent(this.backgroundMusic.src.split('/').pop());
        let idx = this.musicTracks.findIndex(track => track.split('/').pop() === currentFile);
        idx = (idx - 1 + this.musicTracks.length) % this.musicTracks.length;
        this.selectTrack(idx);
    }
    nextTrack() {
        if (!this.backgroundMusic) return;
        const currentFile = decodeURIComponent(this.backgroundMusic.src.split('/').pop());
        let idx = this.musicTracks.findIndex(track => track.split('/').pop() === currentFile);
        idx = (idx + 1) % this.musicTracks.length;
        this.selectTrack(idx);
    }
    _updateMusicButton() {
        const musicButton = document.getElementById('music-toggle');
        if (!musicButton) return;
        if (this.musicEnabled) {
            musicButton.textContent = '\u23F8\uFE0F';
            musicButton.title = 'Musik pausieren (M)';
        } else {
            musicButton.textContent = '\u25B6\uFE0F';
            musicButton.title = 'Musik abspielen (M)';
        }
    }
    showOverlay() {
        if (!this._overlayInstance) {
            this._overlayInstance = new MusicOverlay(this);
        }
        this._overlayInstance.show();
    }
}

// === MusicOverlay: Track-Auswahl ===
class MusicOverlay {
    constructor(musicManager) {
        this.musicManager = musicManager;
        this.overlay = null;
        this.grid = null;
        this._spaceHandler = null;
        this._outsideClickHandler = null;
        this._closeBtn = null;
        this._initCSS();
    }
    _initCSS() {
        if (!document.getElementById('music-overlay-style')) {
            const style = document.createElement('style');
            style.id = 'music-overlay-style';
            style.textContent = `
                .music-overlay-bg {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.28);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .music-overlay {
                    background: #fff;
                    border-radius: 32px;
                    box-shadow: 0 8px 64px #23294633;
                    padding: 72px 32px 32px 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 320px;
                    min-height: 320px;
                    max-width: 90vw;
                    max-height: 90vh;
                    position: relative;
                    opacity: 1;
                    transform: scale(1);
                }
                .music-overlay-animate-in {
                    animation: overlayBounceInFade 0.6s cubic-bezier(.4,1.3,.6,1) both;
                }
                .music-overlay-animate-out {
                    animation: overlayBounceOutFade 0.5s cubic-bezier(.4,1.3,.6,1) both;
                }
                @keyframes overlayBounceInFade {
                    0% { opacity: 0; transform: scale(0.7); }
                    60% { opacity: 1; transform: scale(1.12); }
                    80% { transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes overlayBounceOutFade {
                    0% { opacity: 1; transform: scale(1); }
                    20% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0; transform: scale(0.7); }
                }
                .music-overlay-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 44px;
                    width: 100%;
                    max-width: 700px;
                }
                .music-overlay-cover-btn {
                    width: 120px; height: 120px;
                    min-width: 90px; min-height: 90px;
                    max-width: 150px; max-height: 150px;
                    aspect-ratio: 1/1;
                    border: none; background: none; box-shadow: none; padding: 0;
                    position: relative;
                    transition: box-shadow 0.2s, transform 0.18s;
                    display: flex; align-items: center; justify-content: center;
                    overflow: visible; outline: none; border-radius: 18px;
                }
                .music-overlay-cover-btn:hover,
                .music-overlay-cover-btn:focus {
                    transform: scale(1.08);
                    box-shadow: 0 8px 32px #FFD16633, 0 2px 8px #23294622;
                    z-index: 2;
                }
                .music-overlay-cover-btn img {
                    width: 100%; height: 100%;
                    border-radius: 18px;
                    box-shadow: 0 4px 24px #0002;
                    display: block; object-fit: cover;
                }
                .music-overlay-cover-btn.active {
                    box-shadow: 0 0 0 8px #FFD166, 0 0 0 18px #6AD1E3, 0 4px 24px #FFD16644;
                    animation: coverPulse 1.2s infinite;
                }
                .music-overlay-cover-btn.active::after {
                    content: '';
                    position: absolute; top: 8px; right: 8px;
                    width: 24px; height: 24px; border-radius: 50%;
                    background: radial-gradient(circle at 60% 40%, #FFD166 70%, #6AD1E3 100%);
                    box-shadow: 0 0 12px #FFD16688;
                    display: block; z-index: 2;
                    animation: playPulse 1.2s infinite;
                }
                @keyframes coverPulse {
                    0%, 100% { box-shadow: 0 0 0 8px #FFD166, 0 0 0 18px #6AD1E3, 0 4px 24px #FFD16644; }
                    50% { box-shadow: 0 0 0 18px #FFD16644, 0 0 0 32px #6AD1E344, 0 4px 32px #FFD16688; }
                }
                @keyframes playPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.18); opacity: 0.7; }
                }
                .music-overlay-close {
                    position: absolute; top: 32px; right: 32px;
                    background: #FFD166; border: none;
                    font-size: 3.2rem; color: #fff; cursor: pointer;
                    border-radius: 50%; width: 56px; height: 56px;
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10001;
                    box-shadow: 0 2px 12px #FFD16688;
                    transition: background 0.18s, color 0.18s, transform 0.18s;
                }
                .music-overlay-close:hover {
                    background: #232946; color: #FFD166; transform: scale(1.1);
                }
                @media (max-width: 900px) {
                    .music-overlay-grid { grid-template-columns: repeat(3, 1fr); gap: 28px; }
                }
                @media (max-width: 600px) {
                    .music-overlay { padding: 38px 6px 6px 6px; min-width: 0; min-height: 0; max-width: 99vw; max-height: 99vh; }
                    .music-overlay-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; }
                    .music-overlay-close { top: 18px; right: 18px; width: 38px; height: 38px; font-size: 2rem; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    show() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'music-overlay-bg';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        const dialog = document.createElement('div');
        dialog.className = 'music-overlay music-overlay-animate-in';
        this._closeBtn = document.createElement('button');
        this._closeBtn.className = 'music-overlay-close';
        this._closeBtn.innerHTML = '\u00D7';
        this._closeBtn.onclick = () => this.hide();
        dialog.appendChild(this._closeBtn);
        this.grid = document.createElement('div');
        this.grid.className = 'music-overlay-grid';
        const currentSrc = this.musicManager.backgroundMusic ? this.musicManager.backgroundMusic.src : '';
        let activeBtn = null;
        this.musicManager.musicTracks.forEach((track, idx) => {
            const btn = document.createElement('button');
            btn.className = 'music-overlay-cover-btn';
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-label', 'Song ' + (idx+1));
            if (this.musicManager.backgroundMusic && currentSrc.includes(track)) {
                btn.classList.add('active');
                activeBtn = btn;
            }
            const img = document.createElement('img');
            img.src = this.musicManager.covers[idx];
            img.alt = '';
            btn.appendChild(img);
            btn.onclick = () => {
                this.musicManager.selectTrack(idx);
                this.grid.querySelectorAll('.music-overlay-cover-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            this.grid.appendChild(btn);
        });
        dialog.appendChild(this.grid);
        this.overlay.appendChild(dialog);
        document.body.appendChild(this.overlay);
        if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
            setTimeout(() => {
                activeBtn.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'});
            }, 100);
        }
        this._spaceHandler = (e) => {
            if ((e.code === 'Space' || e.key === ' ') && document.body.contains(this.overlay)) {
                e.preventDefault();
                this.hide();
            }
        };
        document.addEventListener('keydown', this._spaceHandler);
        this._outsideClickHandler = (e) => {
            if (e.target === this.overlay) this.hide();
        };
        this.overlay.addEventListener('mousedown', this._outsideClickHandler);
    }
    hide() {
        if (this._spaceHandler) {
            document.removeEventListener('keydown', this._spaceHandler);
            this._spaceHandler = null;
        }
        if (this.overlay) {
            this.overlay.removeEventListener('mousedown', this._outsideClickHandler);
            const dialog = this.overlay.querySelector('.music-overlay');
            if (dialog) {
                dialog.classList.remove('music-overlay-animate-in');
                dialog.classList.add('music-overlay-animate-out');
                const overlayRef = this.overlay;
                setTimeout(() => {
                    if (overlayRef && overlayRef.parentNode) overlayRef.parentNode.removeChild(overlayRef);
                }, 480);
            } else if (this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
            }
            this.overlay = null;
        }
        this.grid = null;
        this._closeBtn = null;
    }
}

// === PuzzleManager: Puzzle-Fortschrittssystem ===
class PuzzleManager {
    static _shared = null;
    static getShared() {
        if (!PuzzleManager._shared) PuzzleManager._shared = new PuzzleManager();
        return PuzzleManager._shared;
    }
    constructor() {
        this.currentPuzzle = 0;
        this.revealedPieces = 0;
        this.puzzleImages = [
            'images/puzzle-images/puzzle_animals_1.jpg',
            'images/puzzle-images/puzzle_animals_2.jpg',
            'images/puzzle-images/puzzle_animals_3.jpg',
            'images/puzzle-images/puzzle_animals_4.jpg'
        ];
        this.isExpanded = false;
        this.init();
    }
    init() {
        this.createPuzzleContainer();
        this.updateDisplay();
    }
    createPuzzleContainer() {
        const puzzleContainer = document.createElement('div');
        puzzleContainer.id = 'puzzle-container';
        puzzleContainer.className = 'puzzle-container';
        puzzleContainer.innerHTML = `
            <div class="puzzle-grid">
                <div class="puzzle-piece" data-piece="0"></div>
                <div class="puzzle-piece" data-piece="1"></div>
                <div class="puzzle-piece" data-piece="2"></div>
                <div class="puzzle-piece" data-piece="3"></div>
                <div class="puzzle-piece" data-piece="4"></div>
                <div class="puzzle-piece" data-piece="5"></div>
                <div class="puzzle-piece" data-piece="6"></div>
                <div class="puzzle-piece" data-piece="7"></div>
                <div class="puzzle-piece" data-piece="8"></div>
            </div>
        `;
        document.body.appendChild(puzzleContainer);
        puzzleContainer.addEventListener('click', () => this.toggleZoom());
        this.addPuzzleCSS();
    }
    addPuzzleCSS() {
        if (document.getElementById('puzzle-css')) return;
        const style = document.createElement('style');
        style.id = 'puzzle-css';
        style.textContent = `
            .puzzle-container {
                position: fixed; bottom: 20px; right: 20px;
                width: 180px; height: 180px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                cursor: pointer; z-index: 1000;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border: 3px solid #FFD166;
            }
            .puzzle-container:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }
            .puzzle-container.expanded {
                width: 420px; height: 420px;
                bottom: 50px; right: 50px; z-index: 10000;
            }
            .puzzle-grid {
                display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 2px; width: 100%; height: 100%; padding: 8px;
            }
            .puzzle-piece {
                background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                border-radius: 6px; border: 1px solid #ddd;
                transition: none; position: relative;
                overflow: hidden; backface-visibility: hidden;
            }
            .puzzle-piece::before {
                content: '?'; position: absolute;
                top: 50%; left: 50%; transform: translate(-50%, -50%);
                font-size: 1.2em; color: #999; font-weight: bold;
            }
            .puzzle-piece.revealed { background: none; border: 1px solid #FFD166; }
            .puzzle-piece.revealed::before { display: none; }
            .puzzle-piece.revealed { background-size: cover; background-position: center; }
            .puzzle-reveal-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: radial-gradient(circle, rgba(255, 209, 102, 0.3) 0%, transparent 70%);
                z-index: 9999; pointer-events: none;
                animation: revealOverlay 1s ease-out forwards;
            }
            @keyframes revealOverlay {
                0% { opacity: 0; transform: scale(0); }
                50% { opacity: 1; transform: scale(1.2); }
                100% { opacity: 0; transform: scale(2); }
            }
            /* Hochkant-Handys haben zu wenig Platz fuer das Puzzle - es
               ueberdeckt Tastatur und Controls. Puzzle ist nur Belohnung,
               nicht Kernfunktion; deshalb dort ausblenden. */
            @media (max-width: 700px), (orientation: portrait) and (max-width: 900px) {
                .puzzle-container { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }
    toggleZoom() {
        const container = document.getElementById('puzzle-container');
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            container.classList.add('expanded');
        } else {
            container.classList.remove('expanded');
        }
    }
    revealNextPiece() {
        if (this.revealedPieces >= 9) {
            this._celebratePuzzleComplete();
            this.currentPuzzle++;
            this.revealedPieces = 0;
            if (this.currentPuzzle >= this.puzzleImages.length) this.currentPuzzle = 0;
            this.updateDisplay();
            return;
        }
        if (this.currentPuzzle >= this.puzzleImages.length) this.currentPuzzle = 0;
        const newPieceIndex = this.revealedPieces;
        this.revealedPieces++;
        const pieces = document.querySelectorAll('.puzzle-piece');
        const positions = [
            '0% 0%', '50% 0%', '100% 0%',
            '0% 50%', '50% 50%', '100% 50%',
            '0% 100%', '50% 100%', '100% 100%'
        ];
        pieces.forEach((piece, index) => {
            if (index < newPieceIndex) {
                piece.classList.add('revealed');
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                piece.style.backgroundPosition = positions[index];
            } else {
                piece.classList.remove('revealed');
                piece.style.backgroundImage = '';
                piece.style.backgroundSize = '';
                piece.style.backgroundPosition = '';
            }
        });
        setTimeout(() => {
            const piece = document.querySelector(`[data-piece="${newPieceIndex}"]`);
            if (piece) {
                piece.classList.add('revealed');
                piece.style.background = '';
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                piece.style.backgroundPosition = positions[newPieceIndex];
            }
        }, 0);
    }
    updateDisplay() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        const positions = [
            '0% 0%', '50% 0%', '100% 0%',
            '0% 50%', '50% 50%', '100% 50%',
            '0% 100%', '50% 100%', '100% 100%'
        ];
        pieces.forEach((piece, index) => {
            if (index < this.revealedPieces) {
                piece.classList.add('revealed');
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                piece.style.backgroundPosition = positions[index];
            } else {
                piece.classList.remove('revealed');
                piece.style.backgroundImage = '';
                piece.style.backgroundSize = '';
                piece.style.backgroundPosition = '';
            }
        });
    }
    hide() {
        const container = document.getElementById('puzzle-container');
        if (container) container.style.display = 'none';
    }
    show() {
        const container = document.getElementById('puzzle-container');
        if (container) container.style.display = 'block';
    }
    _celebratePuzzleComplete() {
        const container = document.getElementById('puzzle-container');
        if (!container) return;
        container.style.transition = 'all 0.5s cubic-bezier(.4,1.3,.6,1)';
        container.style.transform = 'scale(1.3)';
        container.style.boxShadow = '0 0 40px #FFD166, 0 0 80px #FFD16688';
        container.style.zIndex = '10000';
        if (window._sharedTTS) {
            window._sharedTTS.speak('Super, du hast das Puzzle geschafft!');
        }
        setTimeout(() => {
            container.style.transform = '';
            container.style.boxShadow = '';
            container.style.zIndex = '';
        }, 2500);
    }
}

// === MUSIK-TRACKS & COVERS (zentral) ===
const SHARED_MUSIC_TRACKS = [
    'background music/Whispering_Horizons.mp3',
    'background music/Pixel_Forest.mp3',
    'background music/Echoes_of_the_Woods.mp3',
    'background music/Echoes_of_the_Wild.mp3',
    'background music/Grove.mp3',
    'background music/Natures_Glow.mp3',
    'background music/Joyful_Simplicity.mp3',
    'background music/Trap_Paradise.mp3',
    'background music/Funky_Playground_Groove.mp3',
    'background music/Whispering_Sunshine.mp3',
    'background music/Pathways.mp3',
    'background music/Soothing_of_the_Pines.mp3'
];
const SHARED_MUSIC_COVERS = [
    'images/Plattencover/cover_01.jpg',
    'images/Plattencover/cover_02.jpg',
    'images/Plattencover/cover_03.jpg',
    'images/Plattencover/cover_04.jpg',
    'images/Plattencover/cover_05.jpg',
    'images/Plattencover/cover_06.jpg',
    'images/Plattencover/cover_07.jpg',
    'images/Plattencover/cover_08.jpg',
    'images/Plattencover/cover_09.jpg',
    'images/Plattencover/cover_10.jpg',
    'images/Plattencover/cover_11.jpg',
    'images/Plattencover/cover_12.jpg'
];
