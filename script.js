// === TTSManager: Text-to-Speech als eigene Klasse ===
class TTSManager {
    constructor() {}
    async speak(text) {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Laufende Sprachausgabe abbrechen!
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
        utterance.rate = 0.8;
        utterance.pitch = 1.1;
        utterance.onend = () => { if (onEnd) onEnd(); };
        utterance.onerror = () => { window.speechSynthesis.cancel(); if (onEnd) onEnd(); };
        speechSynthesis.speak(utterance);
    }
}

// === MusicManager: Musiksteuerung als eigene Klasse ===
class MusicManager {
    constructor(tracks, covers) {
        this.musicTracks = tracks;
        this.covers = covers;
        this.backgroundMusic = null;
        this.musicEnabled = true;
    }
    playBackgroundMusic() {
        if (!this.musicEnabled) return;
        if (!this.backgroundMusic) {
            const randomIndex = Math.floor(Math.random() * this.musicTracks.length);
            const track = this.musicTracks[randomIndex];
            this.backgroundMusic = new Audio(track);
            this.backgroundMusic.loop = false;
            this.backgroundMusic.volume = 0.3;
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
        this.backgroundMusic.volume = 0.3;
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
            musicButton.textContent = '⏸️';
            musicButton.title = 'Musik pausieren (M)';
        } else {
            musicButton.textContent = '▶️';
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

// === UIManager: UI- und DOM-Logik als eigene Klasse ===
class UIManager {
    constructor(game) {
        this.game = game; // Referenz auf das Spiel für State-Zugriff
    }
    // Aktualisiert Punktestand und Level im UI
    updateDisplay() {
        document.getElementById('score').textContent = this.game.state.score;
        document.getElementById('level').textContent = this.game.state.level;
    }
    // Zeigt das aktuelle Level im Level-Indikator
    updateLevelIndicator() {
        const indicator = document.getElementById('level-indicator');
        if (indicator) {
            indicator.textContent = this.game.state.level;
        }
    }
    // Aktualisiert die Stern-Anzeige (1 Stern pro 5 Level)
    updateStars() {
        const container = document.getElementById('star-progress');
        if (!container) return;
        const level = this.game.state.level;
        const earnedStars = Math.floor((level - 1) / 5);
        const totalStars = 7; // max 35 Level → 7 Sterne
        container.innerHTML = '';
        for (let i = 0; i < totalStars; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i < earnedStars ? ' earned' : '');
            star.textContent = '⭐';
            container.appendChild(star);
        }
    }

    // Zeigt einen großen Tastatur-Hinweis im UI
    showBigKeyHint(key) {
        const hint = document.getElementById('big-key-hint');
        if (!hint) return;
        hint.innerHTML = `<span>${key}</span>`;
        hint.classList.add('show');
        clearTimeout(this._bigKeyTimeout);
        this._bigKeyTimeout = setTimeout(() => {
            hint.classList.remove('show');
        }, 1400);
    }
    // Zeigt den Celebration-Screen und ruft Callback nach Schließen auf
    showCelebration(correctAnswer, onContinue) {
        const successScreen = document.getElementById('success-screen');
        const successNumber = document.getElementById('success-number');
        successNumber.textContent = correctAnswer;
        successScreen.classList.add('show');
        // Keine eigenen Skip-Handler hier — das wird von handleNumberClick gesteuert
        if (onContinue) {
            // Auto-Dismiss nach 3 Sekunden falls nicht manuell geschlossen
            this._celebrationTimeout = setTimeout(() => {
                successScreen.classList.remove('show');
                onContinue();
            }, 3000);
        }
    }
}

// === GameLogic: Spiellogik als eigene Klasse ===
class GameLogic {
    constructor(game) {
        this.game = game; // Referenz auf das Hauptspiel für State und Hilfsmethoden
    }
    /**
     * Erstellt eine neue Challenge (neue Objekte und richtige Antwort) und spricht die Instruktion.
     */
    async createNewChallenge() {
        const category = this.game.objectCategories[Math.floor(Math.random() * this.game.objectCategories.length)];
        // Schwierigkeitskurve: Eltern-Override oder schrittweise Steigerung
        let maxObjects;
        if (this.game.state.maxObjectsOverride) {
            maxObjects = this.game.state.maxObjectsOverride;
        } else {
            const level = this.game.state.level;
            if (level <= 5)       maxObjects = 3;
            else if (level <= 10) maxObjects = 4;
            else if (level <= 15) maxObjects = 5;
            else if (level <= 20) maxObjects = 6;
            else if (level <= 25) maxObjects = 7;
            else if (level <= 30) maxObjects = 8;
            else                  maxObjects = 9;
        }
        this.game.state.correctAnswer = Math.floor(Math.random() * maxObjects) + 1;
        this.game.state.currentObjects = [];
        for (let i = 0; i < this.game.state.correctAnswer; i++) {
            this.game.state.currentObjects.push(category.emoji);
        }
        this.game.displayObjects();
        await this.game.speakInstruction();
    }
    /**
     * Behandelt einen Klick auf eine Zahl. Bei richtiger Antwort: Punkte, Sound, TTS, Animation, Celebration.
     * Bei falscher Antwort: Sound, TTS, Shake + Cooldown.
     */
    async handleNumberClick(number) {
        // Input-Lock: Keine Eingabe während Verarbeitung
        if (this.game.state.isProcessing) return;
        this.game.state.isProcessing = true;

        if (number === this.game.state.correctAnswer) {
            this.game.state.wrongStreak = 0;
            this.game.state.score += this.game.state.level * 10;
            this.game.playSound('success');
            await this.game.speakSuccess();
            this.game.celebrateObjects();
            this.game.puzzle.revealNextPiece();

            let animationSkipped = false;
            const skipToNext = () => {
                if (animationSkipped) return;
                animationSkipped = true;
                document.removeEventListener('keydown', skipKeyHandler);
                document.removeEventListener('click', skipClickHandler);
                // Auto-Dismiss-Timeout abbrechen
                if (this.game.ui._celebrationTimeout) {
                    clearTimeout(this.game.ui._celebrationTimeout);
                    this.game.ui._celebrationTimeout = null;
                }
                const successScreen = document.getElementById('success-screen');
                if (successScreen) successScreen.classList.remove('show');
                this.nextLevel();
            };
            const skipKeyHandler = (e) => {
                if (e.code === 'Space' || e.key === ' ') {
                    e.preventDefault();
                    skipToNext();
                }
            };
            const skipClickHandler = () => skipToNext();
            document.addEventListener('keydown', skipKeyHandler);
            document.addEventListener('click', skipClickHandler);

            setTimeout(() => {
                if (!animationSkipped) {
                    this.game.ui.showCelebration(this.game.state.correctAnswer, () => {
                        skipToNext();
                    });
                }
            }, 1000);
        } else {
            this.game.state.wrongStreak++;
            this.game.playSound('wrong');
            await this.game.speakWrong(number);
            this.game.shakeObjects();
            // Nach 3 Fehlversuchen: Hinweis geben
            if (this.game.state.wrongStreak >= 3) {
                this.game.state.wrongStreak = 0;
                setTimeout(() => {
                    this.game._showHint();
                }, 600);
            }
            // Kurzer Cooldown nach falscher Antwort
            setTimeout(() => {
                this.game.state.isProcessing = false;
            }, 500);
        }
    }
    /**
     * Steigt ins nächste Level auf und startet die nächste Challenge.
     */
    async nextLevel() {
        this.game.state.level++;
        this.game.state.wrongStreak = 0;
        await this.createNewChallenge();
        this.game.ui.updateDisplay();
        this.game.ui.updateLevelIndicator();
        this.game.ui.updateStars();
        // Input erst freigeben, nachdem die neue Challenge geladen ist
        this.game.state.isProcessing = false;
    }
}

class CountingGame {
    constructor() {
        // Zentrales State-Objekt für den gesamten Spielzustand
        this.state = {
            score: 0,              // Aktueller Punktestand
            level: 1,              // Aktuelles Level
            currentObjects: [],    // Aktuelle Objekte (Emojis)
            correctAnswer: 0,      // Richtige Antwort für das aktuelle Rätsel
            numbersVisible: false, // Ist das Zahlenfeld sichtbar?
            isProcessing: false,   // Sperrt Input während Antwort-Verarbeitung
            wrongStreak: 0,        // Fehlversuche in Folge für aktuelles Level
            maxObjectsOverride: 0, // Eltern-Override für max. Objekte (0 = automatisch)
        };
        this.soundEnabled = true;
        this.speechEnabled = true;
        this.musicTracks = [
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
        this.objectCategories = [
            { emoji: '🍎', name: 'Äpfel' },
            { emoji: '🍕', name: 'Pizzen' },
            { emoji: '🦄', name: 'Einhörner' },
            { emoji: '🐶', name: 'Hunde' },
            { emoji: '🐱', name: 'Katzen' },
            { emoji: '🐰', name: 'Hasen' },
            { emoji: '🐸', name: 'Frösche' },
            { emoji: '🐼', name: 'Pandas' },
            { emoji: '🐨', name: 'Koalas' },
            { emoji: '🦁', name: 'Löwen' },
            { emoji: '🐮', name: 'Kühe' },
            { emoji: '🐷', name: 'Schweine' },
            { emoji: '🐙', name: 'Kraken' },
            { emoji: '🦒', name: 'Giraffen' },
            { emoji: '🐘', name: 'Elefanten' },
            { emoji: '🦊', name: 'Füchse' },
            { emoji: '🐻', name: 'Bären' },
            { emoji: '🦋', name: 'Schmetterlinge' },
            { emoji: '🐞', name: 'Marienkäfer' },
            { emoji: '🦕', name: 'Dinosaurier' }
        ];
        // Singular-Formen mit Artikel (Plural → Singular)
        this.singularMap = {
            'Äpfel': 'ein Apfel', 'Pizzen': 'eine Pizza', 'Einhörner': 'ein Einhorn',
            'Hunde': 'ein Hund', 'Katzen': 'eine Katze', 'Hasen': 'ein Hase',
            'Frösche': 'ein Frosch', 'Pandas': 'ein Panda', 'Koalas': 'ein Koala',
            'Löwen': 'ein Löwe', 'Kühe': 'eine Kuh', 'Schweine': 'ein Schwein',
            'Kraken': 'eine Krake', 'Giraffen': 'eine Giraffe', 'Elefanten': 'ein Elefant',
            'Füchse': 'ein Fuchs', 'Bären': 'ein Bär', 'Schmetterlinge': 'ein Schmetterling',
            'Marienkäfer': 'ein Marienkäfer', 'Dinosaurier': 'ein Dinosaurier'
        };
        this.audioContext = null;
        this.tts = new TTSManager();
        this.music = new MusicManager(this.musicTracks, [
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
        ]);
        this.ui = new UIManager(this);
        this.logic = new GameLogic(this);
        this.puzzle = new PuzzleManager();
        this.init();
    }

    getAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    init() {
        console.log('Spiel wird initialisiert...');
        this.bindEvents();
        // Das Spiel wird erst nach dem Klick auf "Spiel starten" initialisiert
        console.log('Startscreen wird angezeigt');
    }

    _playStartSound() {
        try {
            const ctx = this.getAudioContext();
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

    _triggerStartTransition() {
        this._playStartSound();
        document.removeEventListener('keydown', this._startKeyHandler);
        const btn = document.querySelector('.startscreen-play-btn');
        btn.classList.add('clicked');
        const startscreen = document.getElementById('startscreen');
        startscreen.classList.add('hide');
        setTimeout(() => {
            this.startGame();
            btn.classList.remove('clicked');
            startscreen.classList.remove('hide');
        }, 600);
    }

    bindEvents() {
        // Play-Button
        document.querySelector('.startscreen-play-btn').addEventListener('click', () => {
            this._triggerStartTransition();
        });
        // Start per Tastatur (Leertaste oder Enter)
        this._startKeyHandler = (e) => {
            const startscreen = document.getElementById('startscreen');
            if (startscreen.style.display !== 'none' && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                this._triggerStartTransition();
            }
        };
        document.addEventListener('keydown', this._startKeyHandler);
    }

    _initParentMenu() {
        const indicator = document.getElementById('level-indicator');
        if (!indicator) return;
        let pressTimer = null;
        indicator.style.cursor = 'pointer';
        const startPress = () => {
            pressTimer = setTimeout(() => this._showParentMenu(), 800);
        };
        const cancelPress = () => {
            if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        };
        indicator.addEventListener('mousedown', startPress);
        indicator.addEventListener('mouseup', cancelPress);
        indicator.addEventListener('mouseleave', cancelPress);
        indicator.addEventListener('touchstart', startPress, { passive: true });
        indicator.addEventListener('touchend', cancelPress);
    }

    _showParentMenu() {
        // Overlay erstellen
        const overlay = document.createElement('div');
        overlay.id = 'parent-menu-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:24px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:340px;width:90vw;';

        const currentMax = this._getCurrentMaxObjects();
        dialog.innerHTML = `
            <div style="font-size:1.4rem;font-weight:700;color:#232946;margin-bottom:8px;">⚙️ Eltern-Einstellungen</div>
            <div style="font-size:0.9rem;color:#666;margin-bottom:20px;">Lange auf Level-Zahl drücken zum Öffnen</div>
            <div style="margin-bottom:20px;">
                <div style="font-size:1rem;font-weight:700;color:#232946;margin-bottom:8px;">Startschwierigkeit (max. Objekte): <span id="parent-diff-val">${currentMax}</span></div>
                <input type="range" id="parent-diff-slider" min="2" max="9" value="${currentMax}" style="width:100%;accent-color:#FFD166;">
            </div>
            <div style="margin-bottom:20px;">
                <div style="font-size:1rem;font-weight:700;color:#232946;margin-bottom:8px;">Level anpassen:</div>
                <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
                    <button id="parent-level-down" style="background:#f0f2f5;border:none;border-radius:12px;width:40px;height:40px;font-size:1.4rem;font-weight:700;cursor:pointer;">−</button>
                    <span id="parent-level-val" style="font-size:1.6rem;font-weight:700;color:#232946;min-width:40px;">${this.state.level}</span>
                    <button id="parent-level-up" style="background:#f0f2f5;border:none;border-radius:12px;width:40px;height:40px;font-size:1.4rem;font-weight:700;cursor:pointer;">+</button>
                </div>
            </div>
            <div style="display:flex;gap:12px;justify-content:center;">
                <button id="parent-menu-apply" style="background:#6AD1E3;color:#fff;border:none;border-radius:14px;padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;">Übernehmen</button>
                <button id="parent-menu-close" style="background:#f0f2f5;color:#232946;border:none;border-radius:14px;padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;">Abbrechen</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        let newLevel = this.state.level;
        let newMaxOverride = currentMax;

        const slider = document.getElementById('parent-diff-slider');
        const diffVal = document.getElementById('parent-diff-val');
        slider.addEventListener('input', () => {
            newMaxOverride = parseInt(slider.value);
            diffVal.textContent = newMaxOverride;
        });

        const levelVal = document.getElementById('parent-level-val');
        document.getElementById('parent-level-down').addEventListener('click', () => {
            if (newLevel > 1) { newLevel--; levelVal.textContent = newLevel; }
        });
        document.getElementById('parent-level-up').addEventListener('click', () => {
            newLevel++; levelVal.textContent = newLevel;
        });

        const cleanup = () => {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        };
        const keyHandler = (e) => {
            if (e.key === 'Escape') cleanup();
        };
        document.addEventListener('keydown', keyHandler);

        document.getElementById('parent-menu-apply').addEventListener('click', () => {
            this.state.level = newLevel;
            this.state.maxObjectsOverride = newMaxOverride;
            this.ui.updateLevelIndicator();
            this.ui.updateStars();
            this.logic.createNewChallenge();
            cleanup();
        });
        document.getElementById('parent-menu-close').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
    }

    _getCurrentMaxObjects() {
        if (this.state.maxObjectsOverride) return this.state.maxObjectsOverride;
        const level = this.state.level;
        if (level <= 5) return 3;
        if (level <= 10) return 4;
        if (level <= 15) return 5;
        if (level <= 20) return 6;
        if (level <= 25) return 7;
        if (level <= 30) return 8;
        return 9;
    }

    async enableGameEvents() {
        // Zahlen-Buttons (Input-Lock wird in handleNumberClick geprüft)
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn._numberClickHandler = async () => {
                if (this.state.isProcessing) return;
                await this.logic.handleNumberClick(parseInt(btn.dataset.number));
            };
            btn.addEventListener('click', btn._numberClickHandler);
        });
        // Tastatur-Events
        document.addEventListener('keydown', this._handleKeyPressBound);
        // Control-Buttons
        const ids = [
            {id: 'next-level-btn', fn: async () => await this.logic.nextLevel()},
            {id: 'music-toggle', fn: () => this.toggleMusic()},
            {id: 'tracklist-toggle', fn: () => this.music.showOverlay()},
            {id: 'sound-toggle', fn: () => this.toggleSound()},
            {id: 'close-btn', fn: () => this.closeGame()},
            {id: 'numbers-toggle', fn: () => this.toggleNumbers()},
            {id: 'prev-track', fn: () => this.music.prevTrack()},
            {id: 'next-track', fn: () => this.music.nextTrack()}
        ];
        ids.forEach(obj => {
            const el = document.getElementById(obj.id);
            if (el) {
                el._clickHandler = obj.fn;
                el.addEventListener('click', el._clickHandler);
            }
        });
        // Fokus-Styles für alle Buttons
        document.querySelectorAll('button').forEach(btn => {
            btn._focusHandler = () => btn.classList.add('focus');
            btn._blurHandler = () => btn.classList.remove('focus');
            btn.addEventListener('focus', btn._focusHandler);
            btn.addEventListener('blur', btn._blurHandler);
        });
    }

    async startGame() {
        console.log('Spiel wird gestartet...');
        // Fullscreen aktivieren (falls vom Browser erlaubt)
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }
        } catch(e) { /* Fullscreen nicht verfügbar oder abgelehnt — kein Problem */ }
        // Trail-Animation stoppen
        if (window._trailControl) window._trailControl.stop();
        // Verstecke Startscreen
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'none';
        startscreen.style.pointerEvents = 'none';
        // Zeige Spiel
        document.getElementById('game-container').style.display = 'block';
        // Zeige Puzzle
        this.puzzle.show();
        // Event-Listener für das Spiel aktivieren
        await this.enableGameEvents();
        // Starte das Spiel sofort
        await this.logic.createNewChallenge();
        this.ui.updateDisplay();
        this.ui.updateLevelIndicator();
        this.ui.updateStars();
        // Setze Zahlenfeld-Button auf ausgeschaltet
        const numbersButton = document.getElementById('numbers-toggle');
        numbersButton.textContent = '⌨️';
        numbersButton.title = 'Zahlenfeld an';
        // Verstecke das Zahlenfeld tatsächlich
        const numbersContainer = document.getElementById('numbers-container');
        numbersContainer.style.display = 'none';
        // Eltern-Menü initialisieren
        this._initParentMenu();
        // Starte Hintergrundmusik
        this.music.playBackgroundMusic();
        console.log('Spiel-Initialisierung abgeschlossen');
    }

    async handleKeyPress(e) {
        const key = e.key;
        // ESC schließt das Spiel (immer erlaubt)
        if (key === 'Escape') {
            e.preventDefault();
            this.closeGame();
            return;
        }
        // Shortcuts für Musik und Zahlenfeld (immer erlaubt)
        if (key.toLowerCase() === 'm') {
            e.preventDefault();
            this.toggleMusic();
            return;
        }
        if (key.toLowerCase() === 'n') {
            e.preventDefault();
            this.toggleNumbers();
            return;
        }
        if (key.toLowerCase() === 's') {
            e.preventDefault();
            this.toggleSound();
            return;
        }
        // Zahlentasten: Input-Lock beachten
        if (key >= '1' && key <= '9') {
            if (this.state.isProcessing) return;
            await this.logic.handleNumberClick(parseInt(key));
            if (parseInt(key) !== this.state.correctAnswer) {
                this.ui.showBigKeyHint(key);
            }
        }
    }

    createNewChallenge() {
        this.logic.createNewChallenge();
    }

    displayObjects() {
        const container = document.getElementById('objects-display');
        container.innerHTML = '';
        
        // Responsive Grid-Größe basierend auf Bildschirmbreite
        const isMobile = window.innerWidth <= 480;
        const gridCols = isMobile ? 3 : 4;
        const gridRows = isMobile ? 4 : 3;
        const gridSize = gridCols * gridRows;
        
        const availablePositions = Array.from({length: gridSize}, (_, i) => i);
        
        // Wähle zufällige Positionen für die Objekte
        const selectedPositions = [];
        for (let i = 0; i < this.state.correctAnswer; i++) {
            if (availablePositions.length > 0) {
                const randomIndex = Math.floor(Math.random() * availablePositions.length);
                selectedPositions.push(availablePositions.splice(randomIndex, 1)[0]);
            }
        }
        
        // Erstelle die Objekte an den ausgewählten Positionen
        selectedPositions.forEach((position, index) => {
            const object = document.createElement('div');
            object.className = 'object';
            object.textContent = this.state.currentObjects[0];
            
            // Leichte Drehung für Verspieltheit
            const rot = (Math.random() - 0.5) * 8; // -4° bis +4°
            object.style.transform = `rotate(${rot}deg)`;
            
            // Setze Grid-Position
            const row = Math.floor(position / gridCols) + 1;
            const col = (position % gridCols) + 1;
            object.style.gridRow = row;
            object.style.gridColumn = col;
            
            container.appendChild(object);
        });
    }

    speakInstruction() {
        console.log('[TTS] speakInstruction() aufgerufen, speechEnabled:', this.speechEnabled);
        if (!this.speechEnabled) return;
        const category = this.objectCategories.find(cat => cat.emoji === this.state.currentObjects[0]);
        const objectName = category ? category.name : 'Objekte';
        const instruction = `Wie viele ${objectName} siehst du?`;
        console.log('[TTS] Instruction-Text:', instruction);
        this.tts.speak(instruction);
    }

    _getObjectInfo() {
        const numberNames = ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
        let objName = 'Objekte';
        if (this.state.currentObjects.length > 0) {
            const category = this.objectCategories.find(cat => cat.emoji === this.state.currentObjects[0]);
            if (category) objName = category.name;
        }
        return { numberNames, objName };
    }

    _getSingular(objName) {
        return this.singularMap[objName] || 'ein ' + objName.slice(0, -1);
    }

    speakSuccess() {
        console.log('[TTS] speakSuccess() aufgerufen');
        const { numberNames, objName } = this._getObjectInfo();
        const zahlwort = numberNames[this.state.correctAnswer - 1] || this.state.correctAnswer.toString();
        let msg;
        if (this.state.correctAnswer === 1) {
            msg = `Ja genau! ${this._getSingular(objName)}!`;
        } else {
            msg = `Ja genau! ${zahlwort.charAt(0).toUpperCase() + zahlwort.slice(1)} ${objName}!`;
        }
        console.log('[TTS] Success-Text:', msg);
        this.tts.speak(msg);
    }

    speakWrong(guessedNumber) {
        console.log('[TTS] speakWrong() aufgerufen, guessedNumber:', guessedNumber);
        const { numberNames, objName } = this._getObjectInfo();
        const zahlwort = numberNames[guessedNumber - 1] || guessedNumber.toString();
        let message;
        if (guessedNumber === 1) {
            message = `Nein, ${this._getSingular(objName)} ist es nicht. Zähle noch mal, wieviel ${objName} es sind.`;
        } else {
            message = `Nein, ${zahlwort} ${objName} sind es nicht. Zähle noch mal, wieviel ${objName} es sind.`;
        }
        console.log('[TTS] Wrong-Text:', message);
        this.tts.speak(message);
    }

    nextLevel() {
        this.logic.nextLevel();
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        const ctx = this.getAudioContext();
        switch(type) {
            case 'success':
                this.playSuccessMelody();
                break;
            case 'wrong':
                this.playWrongSound();
                break;
        }
    }

    playTone(frequency, duration, type = 'sine') {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    playWrongSound() {
        const ctx = this.getAudioContext();
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

    playSuccessMelody() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C (höher)
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                this.playTone(frequency, 0.2, 'sine');
            }, index * 150);
        });
    }

    speakWelcome() {
        console.log('[TTS] speakWelcome() aufgerufen, speechEnabled:', this.speechEnabled);
        if (!this.speechEnabled) return;
        setTimeout(() => {
            console.log('[TTS] Willkommensansage wird gesprochen...');
            this.tts.speak("Willkommen beim Zählspiel! Schau dir die Objekte an und drücke die richtige Zahl.");
        }, 500);
    }

    toggleMusic() {
        this.music.toggleMusic();
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.speechEnabled = !this.speechEnabled;
        const btn = document.getElementById('sound-toggle');
        if (btn) {
            btn.textContent = this.soundEnabled ? '🔊' : '🔇';
            btn.title = this.soundEnabled ? 'Soundeffekte an/aus (S)' : 'Soundeffekte aus (S)';
        }
    }

    closeGame() {
        // Bestätigung nur wenn Fortschritt vorhanden
        if (this.state.level > 1) {
            this._showCloseConfirmation();
            return;
        }
        this._doCloseGame();
    }

    _showCloseConfirmation() {
        // Overlay erstellen
        const overlay = document.createElement('div');
        overlay.id = 'close-confirm-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:24px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:320px;';
        dialog.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:16px;">🛑</div>
            <div style="font-size:1.2rem;font-weight:700;color:#232946;margin-bottom:24px;">Spiel wirklich beenden?</div>
            <div style="display:flex;gap:16px;justify-content:center;">
                <button id="close-confirm-yes" style="background:#FF6F91;color:#fff;border:none;border-radius:14px;padding:12px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;">Ja</button>
                <button id="close-confirm-no" style="background:#6AD1E3;color:#fff;border:none;border-radius:14px;padding:12px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;">Nein</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const cleanup = () => {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        };
        const keyHandler = (e) => {
            if (e.key === 'Escape') { cleanup(); }
            if (e.key === 'Enter') { cleanup(); this._doCloseGame(); }
        };
        document.addEventListener('keydown', keyHandler);
        document.getElementById('close-confirm-yes').addEventListener('click', () => { cleanup(); this._doCloseGame(); });
        document.getElementById('close-confirm-no').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
    }

    _doCloseGame() {
        // Fullscreen beenden
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
        } catch(e) {}
        // Stoppe Hintergrundmusik
        this.music.stopBackgroundMusic();

        // Puzzle zurücksetzen und verstecken
        this.puzzle.currentPuzzle = 0;
        this.puzzle.revealedPieces = 0;
        this.puzzle.updateDisplay();
        this.puzzle.hide();

        // Offene UI-Overlays schließen
        const successScreen = document.getElementById('success-screen');
        if (successScreen) successScreen.classList.remove('show');
        if (this.ui._celebrationTimeout) {
            clearTimeout(this.ui._celebrationTimeout);
            this.ui._celebrationTimeout = null;
        }

        // Reset Spielstand
        this.state.score = 0;
        this.state.level = 1;
        this.state.isProcessing = false;

        // Verstecke Spiel, zeige Startscreen
        document.getElementById('game-container').style.display = 'none';
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'flex';
        startscreen.style.pointerEvents = 'auto';

        // Deaktiviere Spiel-Events
        this.disableGameEvents();

        // Startscreen-Keyboard-Listener wieder aktivieren
        document.addEventListener('keydown', this._startKeyHandler);

        // Trail-Animation wieder starten
        if (window._trailControl) window._trailControl.start();
    }

    _showHint() {
        const answer = this.state.correctAnswer;
        const { numberNames } = this._getObjectInfo();
        const zahlwort = numberNames[answer - 1] || answer.toString();
        // TTS Hinweis
        this.tts.speak(`Kleiner Tipp: Es sind ${zahlwort}.`);
        // Richtige Zahl kurz visuell blinken lassen
        const hint = document.getElementById('big-key-hint');
        if (hint) {
            hint.innerHTML = `<span style="color:rgba(106,209,227,0.6);">${answer}</span>`;
            hint.classList.add('show');
            clearTimeout(this.ui._bigKeyTimeout);
            this.ui._bigKeyTimeout = setTimeout(() => {
                hint.classList.remove('show');
            }, 2000);
        }
    }

    toggleNumbers() {
        this.state.numbersVisible = !this.state.numbersVisible;
        const numbersButton = document.getElementById('numbers-toggle');
        const numbersContainer = document.getElementById('numbers-container');
        const objectsDisplay = document.getElementById('objects-display');
        if (this.state.numbersVisible) {
            numbersButton.textContent = '🔢';
            numbersButton.title = 'Zahlenfeld aus';
            numbersContainer.classList.remove('hide');
            numbersContainer.classList.add('show');
            numbersContainer.style.display = 'grid';
            objectsDisplay.classList.add('with-numbers');
        } else {
            numbersButton.textContent = '⌨️';
            numbersButton.title = 'Zahlenfeld an';
            numbersContainer.classList.remove('show');
            numbersContainer.classList.add('hide');
            objectsDisplay.classList.remove('with-numbers');
            setTimeout(() => {
                if (!this.state.numbersVisible) numbersContainer.style.display = 'none';
            }, 500);
        }
    }

    shakeObjects() {
        const objects = document.querySelectorAll('.object');
        
        // Schüttel-Animation zu allen Objekten hinzufügen
        objects.forEach(obj => {
            obj.classList.add('shake');
        });
        
        // Body kurz rot einfärben
        document.body.classList.add('flash-wrong');
        
        setTimeout(() => {
            objects.forEach(obj => {
                obj.classList.remove('shake');
            });
            document.body.classList.remove('flash-wrong');
        }, 500);
    }

    celebrateObjects() {
        const objects = document.querySelectorAll('.object');
        
        // Feier-Animation zu allen Objekten hinzufügen
        objects.forEach(obj => {
            obj.classList.add('celebrate');
        });
        
        // Konfetti-Explosion erstellen
        this.createConfetti();
        
        // Animation nach 1 Sekunde entfernen
        setTimeout(() => {
            objects.forEach(obj => {
                obj.classList.remove('celebrate');
            });
        }, 1000);
    }

    createConfetti() {
        // Konfetti-Container direkt im Body platzieren
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        // 25 Konfetti-Partikel erstellen (mehr für spektakuläreren Effekt)
        for (let i = 0; i < 25; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            // Zentrum der Explosion
            // Mittelpunkt von objects-display relativ zum Viewport
            const objectsDisplay = document.getElementById('objects-display');
            const rect = objectsDisplay.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Zufällige Explosionsrichtung (360 Grad)
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 400; // 200-600px Explosionsdistanz (vorher 80-200px)
            // Berechne Endposition basierend auf Winkel und Distanz
            const explosionX = Math.cos(angle) * distance;
            const explosionY = Math.sin(angle) * distance;
            // Setze CSS-Variablen für die Animation
            confetti.style.setProperty('--explosion-x', explosionX + 'px');
            confetti.style.setProperty('--explosion-y', explosionY + 'px');
            // Position im Zentrum
            confetti.style.left = centerX + 'px';
            confetti.style.top = centerY + 'px';
            // Zufällige Verzögerung für natürlicheren Explosionseffekt
            confetti.style.animationDelay = Math.random() * 0.2 + 's';
            // Zufällige Animation-Dauer für variablen Effekt
            confetti.style.animationDuration = (0.6 + Math.random() * 0.4) + 's';
            confettiContainer.appendChild(confetti);
        }
        // Konfetti-Container nach 1.5 Sekunden entfernen
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 1500);
    }

    // --- Event-Listener für das Spiel deaktivieren ---
    disableGameEvents() {
        // Zahlen-Buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.removeEventListener('click', btn._numberClickHandler);
        });

        // Tastatur-Events
        document.removeEventListener('keydown', this._handleKeyPressBound);
        // Control-Buttons
        const ids = [
            'next-level-btn',
            'music-toggle',
            'tracklist-toggle',
            'sound-toggle',
            'close-btn',
            'numbers-toggle',
            'prev-track',
            'next-track'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && el._clickHandler) {
                el.removeEventListener('click', el._clickHandler);
            }
        });
        // Fokus-Styles für alle Buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.removeEventListener('focus', btn._focusHandler);
            btn.removeEventListener('blur', btn._blurHandler);
        });
    }

    // --- Hilfsfunktion für Tastatur-Events ---
    _handleKeyPressBound = (e) => this.handleKeyPress(e);
}

// Spiel starten wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    window.countObjectsGameInstance = new CountingGame();
});

// Touch-Events für mobile Geräte
document.addEventListener('touchstart', function() {}, {passive: true});

// --- Exakte Pastell-Partikelspur mit 2-Farben-Verlauf auf dem Startscreen ---
(function() {
    const NUM_POINTS = 140;
    // Zwei harmonische Pastellfarben: Rosa → Türkis
    const COLOR_STOPS = [
        [255, 183, 213], // Pastellrosa
        [144, 224, 239]  // Pastelltürkis
    ];
    let trail = [];
    let running = false;
    let canvas, ctx;
    let frameCount = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpColor(c1, c2, t) {
        return [
            Math.round(lerp(c1[0], c2[0], t)),
            Math.round(lerp(c1[1], c2[1], t)),
            Math.round(lerp(c1[2], c2[2], t))
        ];
    }
    function getGradientColor(t) {
        const n = COLOR_STOPS.length - 1;
        const scaled = t * n;
        const idx = Math.floor(scaled);
        const frac = scaled - idx;
        const c1 = COLOR_STOPS[idx];
        const c2 = COLOR_STOPS[Math.min(idx+1, n)];
        const [r, g, b] = lerpColor(c1, c2, frac);
        return `rgb(${r},${g},${b})`;
    }

    function repelFromRects(p, rects) {
        rects.forEach(rect => {
            const cx = rect.left + rect.width/2;
            const cy = rect.top + rect.height/2;
            const dx = p.x - cx;
            const dy = p.y - cy;
            const rx = Math.max(rect.left, Math.min(p.x, rect.right));
            const ry = Math.max(rect.top, Math.min(p.y, rect.bottom));
            const dist = Math.hypot(p.x - rx, p.y - ry);
            if (dist < 60) {
                const force = (60 - dist) * 0.18;
                const angle = Math.atan2(dy, dx);
                p.x += Math.cos(angle) * force;
                p.y += Math.sin(angle) * force;
            }
        });
    }

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function initTrail() {
        canvas = document.getElementById('trail-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        trail = [];
        for (let i = 0; i < NUM_POINTS; i++) {
            trail.push({
                x: window.innerWidth/2,
                y: window.innerHeight/2
            });
        }
        frameCount = 0;
        running = true;
    }

    function updateTrail(mouseX, mouseY) {
        frameCount++;
        // Nur ca. 5 von 6 Frames eine neue Mausposition speichern (minimal träger)
        if (frameCount % 6 !== 0) {
            trail.push({ x: mouseX, y: mouseY });
            if (trail.length > NUM_POINTS) trail.shift();
        }
        // Kollision mit Play-Button
        const btn = document.querySelector('.startscreen-play-btn');
        let rects = [];
        if (btn) rects.push(btn.getBoundingClientRect());
        trail.forEach(p => repelFromRects(p, rects));
    }

    function drawTrail() {
        if (!running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            const t = i / (trail.length-1);
            // Größe umkehren: größte Kreise am Anfang (Maus), kleinste am Ende
            const size = 9 + (1-t) * 13;
            const color = getGradientColor(t);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, 2*Math.PI);
            ctx.fillStyle = color;
            ctx.globalAlpha = 1 - t * 0.95;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12 - t * 8;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    let mouse = { x: window.innerWidth/2, y: window.innerHeight/2 };
    function onMouseMove(e) {
        mouse.x = e.touches ? e.touches[0].clientX : e.clientX;
        mouse.y = e.touches ? e.touches[0].clientY : e.clientY;
    }

    function animateTrail() {
        if (!running) return;
        updateTrail(mouse.x, mouse.y);
        drawTrail();
        requestAnimationFrame(animateTrail);
    }

    function onStartscreenVisibility() {
        const startscreen = document.getElementById('startscreen');
        if (startscreen && startscreen.style.display !== 'none') {
            if (!running) {
                initTrail();
                animateTrail();
            }
        } else {
            running = false;
            if (canvas) {
                ctx && ctx.clearRect(0,0,canvas.width,canvas.height);
            }
        }
    }

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onMouseMove, {passive: false});
    // Überwache Sichtbarkeit des Startscreens
    const observer = new MutationObserver(onStartscreenVisibility);
    observer.observe(document.getElementById('startscreen'), { attributes: true, attributeFilter: ['style'] });
    // Initial starten, falls Startscreen sichtbar
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('startscreen').style.display !== 'none') {
            initTrail();
            animateTrail();
        }
    });

    // API zum Stoppen/Starten der Trail-Animation von außen
    window._trailControl = {
        stop() {
            running = false;
            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        },
        start() {
            if (!running) {
                initTrail();
                animateTrail();
            }
        }
    };
})();

// --- Kreiswellen-Animation und Sound auf Startscreen-Klick ---
(function() {
    function playPlickSound() {
        try {
            if (!window.countObjectsGameInstance) return;
            const ctx = window.countObjectsGameInstance.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 540;
            gain.gain.value = 0.11;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.13);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
            osc.stop(ctx.currentTime + 0.18);
        } catch(e) {}
    }

    function createRipple(x, y) {
        const canvas = document.getElementById('trail-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const startTime = performance.now();
        const duration = 650;
        const maxRadius = Math.max(canvas.width, canvas.height) * 0.13;
        function animateRipple(now) {
            const t = Math.min(1, (now - startTime) / duration);
            ctx.save();
            ctx.globalAlpha = 0.22 * (1-t);
            ctx.beginPath();
            // Radius absichern, damit niemals negativ:
            const safeRadius = Math.max(0, maxRadius * t);
            ctx.arc(x, y, safeRadius, 0, 2 * Math.PI);
            ctx.lineWidth = 5 + 10 * (1-t);
            ctx.strokeStyle = 'rgba(144,224,239,0.7)'; // Pastelltürkis
            ctx.shadowColor = 'rgba(255,183,213,0.5)'; // Pastellrosa
            ctx.shadowBlur = 18 * (1-t);
            ctx.stroke();
            ctx.restore();
            if (t < 1) {
                requestAnimationFrame(animateRipple);
            }
        }
        animateRipple(startTime);
    }

    document.getElementById('startscreen').addEventListener('click', function(e) {
        // Nicht auslösen, wenn auf Play-Button oder Video geklickt wurde
        const btn = document.querySelector('.startscreen-play-btn');
        const video = document.querySelector('.startscreen-video');
        if (btn && btn.contains(e.target)) return;
        if (video && video.contains(e.target)) return;
        // Position relativ zum Canvas bestimmen
        const canvas = document.getElementById('trail-canvas');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        createRipple(x, y);
        playPlickSound();
    });
})();

// === Musik-Overlay für die Track-Auswahl ===
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
                    width: 120px;
                    height: 120px;
                    min-width: 90px;
                    min-height: 90px;
                    max-width: 150px;
                    max-height: 150px;
                    aspect-ratio: 1/1;
                    border: none;
                    background: none;
                    box-shadow: none;
                    padding: 0;
                    position: relative;
                    transition: box-shadow 0.2s, transform 0.18s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: visible;
                    outline: none;
                    border-radius: 18px;
                }
                .music-overlay-cover-btn:hover,
                .music-overlay-cover-btn:focus {
                    transform: scale(1.08);
                    box-shadow: 0 8px 32px #FFD16633, 0 2px 8px #23294622;
                    z-index: 2;
                }
                .music-overlay-cover-btn img {
                    width: 100%;
                    height: 100%;
                    border-radius: 18px;
                    box-shadow: 0 4px 24px #0002;
                    display: block;
                    object-fit: cover;
                }
                .music-overlay-cover-btn.active {
                    box-shadow: 0 0 0 8px #FFD166, 0 0 0 18px #6AD1E3, 0 4px 24px #FFD16644;
                    animation: coverPulse 1.2s infinite;
                }
                .music-overlay-cover-btn.active::after {
                    content: '';
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 60% 40%, #FFD166 70%, #6AD1E3 100%);
                    box-shadow: 0 0 12px #FFD16688;
                    display: block;
                    z-index: 2;
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
                    position: absolute;
                    top: 32px;
                    right: 32px;
                    background: #FFD166;
                    border: none;
                    font-size: 3.2rem;
                    color: #fff;
                    cursor: pointer;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    box-shadow: 0 2px 12px #FFD16688;
                    transition: background 0.18s, color 0.18s, transform 0.18s;
                }
                .music-overlay-close:hover {
                    background: #232946;
                    color: #FFD166;
                    transform: scale(1.1);
                }
                @media (max-width: 900px) {
                    .music-overlay-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 28px;
                    }
                }
                @media (max-width: 600px) {
                    .music-overlay {
                        padding: 38px 6px 6px 6px;
                        min-width: 0;
                        min-height: 0;
                        max-width: 99vw;
                        max-height: 99vh;
                    }
                    .music-overlay-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 18px;
                    }
                    .music-overlay-close {
                        top: 18px;
                        right: 18px;
                        width: 38px;
                        height: 38px;
                        font-size: 2rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    show() {
        // Overlay-Background
        this.overlay = document.createElement('div');
        this.overlay.className = 'music-overlay-bg';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        // Haupt-Overlay
        const dialog = document.createElement('div');
        dialog.className = 'music-overlay music-overlay-animate-in';
        // Schließen-Button
        this._closeBtn = document.createElement('button');
        this._closeBtn.className = 'music-overlay-close';
        this._closeBtn.innerHTML = '×';
        this._closeBtn.onclick = () => this.hide();
        dialog.appendChild(this._closeBtn);
        // Grid
        this.grid = document.createElement('div');
        this.grid.className = 'music-overlay-grid';
        // Cover-Buttons
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
                // Markierung sofort aktualisieren
                this.grid.querySelectorAll('.music-overlay-cover-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            this.grid.appendChild(btn);
        });
        dialog.appendChild(this.grid);
        this.overlay.appendChild(dialog);
        document.body.appendChild(this.overlay);
        // Beim Öffnen: Aktuellen Track in die Mitte scrollen
        if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
            setTimeout(() => {
                activeBtn.scrollIntoView({block: 'center', inline: 'center', behavior: 'smooth'});
            }, 100);
        }
        // Schließen mit Leertaste
        this._spaceHandler = (e) => {
            if ((e.code === 'Space' || e.key === ' ') && document.body.contains(this.overlay)) {
                e.preventDefault();
                this.hide();
            }
        };
        document.addEventListener('keydown', this._spaceHandler);
        // Schließen bei Klick außerhalb des Dialogs
        this._outsideClickHandler = (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        };
        this.overlay.addEventListener('mousedown', this._outsideClickHandler);
    }
    hide() {
        if (this.overlay) {
            const dialog = this.overlay.querySelector('.music-overlay');
            if (dialog) {
                dialog.classList.remove('music-overlay-animate-in');
                dialog.classList.add('music-overlay-animate-out');
                setTimeout(() => {
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.parentNode.removeChild(this.overlay);
                    }
                    this.overlay = null;
                }, 480);
            } else if (this.overlay.parentNode) {
                this.overlay.parentNode.removeChild(this.overlay);
                this.overlay = null;
            }
        }
        if (this._spaceHandler) {
            document.removeEventListener('keydown', this._spaceHandler);
            this._spaceHandler = null;
        }
        if (this.overlay) {
            this.overlay.removeEventListener('mousedown', this._outsideClickHandler);
        }
        this.grid = null;
        this._closeBtn = null;
    }
}

// === PuzzleManager: Puzzle-Fortschrittssystem ===
class PuzzleManager {
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
        this._isCelebrating = false;
        this.init();
    }

    init() {
        this.createPuzzleContainer();
        // Kein loadProgress() — Puzzle startet immer frisch (Level startet auch bei 1)
        this.updateDisplay();
    }

    createPuzzleContainer() {
        // Puzzle-Container erstellen
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
        
        // Puzzle-Container zum Body hinzufügen
        document.body.appendChild(puzzleContainer);
        
        // Click-Event für Zoom
        puzzleContainer.addEventListener('click', () => this.toggleZoom());
        
        // CSS für Puzzle hinzufügen
        this.addPuzzleCSS();
    }

    addPuzzleCSS() {
        if (document.getElementById('puzzle-css')) return;
        
        const style = document.createElement('style');
        style.id = 'puzzle-css';
        style.textContent = `
            .puzzle-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 180px;
                height: 180px;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                z-index: 1000;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border: 3px solid #FFD166;
            }
            .puzzle-container:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
            }
            .puzzle-container.expanded {
                width: 420px;
                height: 420px;
                bottom: 50px;
                right: 50px;
                z-index: 10000;
            }
            .puzzle-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2px;
                width: 100%;
                height: 100%;
                padding: 8px;
            }
            .puzzle-piece {
                background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                border-radius: 6px;
                border: 1px solid #ddd;
                transition: none;
                position: relative;
                overflow: hidden;
                backface-visibility: hidden;
            }
            .puzzle-piece::before {
                content: '?';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.2em;
                color: #999;
                font-weight: bold;
            }
            .puzzle-piece.revealed {
                background: none;
                border: 1px solid #FFD166;
            }
            .puzzle-piece.revealed::before {
                display: none;
            }
            .puzzle-piece.revealed {
                background-size: cover;
                background-position: center;
            }
            .puzzle-reveal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: radial-gradient(circle, rgba(255, 209, 102, 0.3) 0%, transparent 70%);
                z-index: 9999;
                pointer-events: none;
                animation: revealOverlay 1s ease-out forwards;
            }
            @keyframes revealOverlay {
                0% {
                    opacity: 0;
                    transform: scale(0);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.2);
                }
                100% {
                    opacity: 0;
                    transform: scale(2);
                }
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
        // Während einer Puzzle-Feier keine neuen Teile aufdecken
        if (this._isCelebrating) return;

        // Prüfe ob das letzte (9.) Teil gerade aufgedeckt wird
        if (this.revealedPieces === 8) {
            // Letztes Teil aufdecken, dann Feier starten
            this.revealedPieces = 9;
            this.updateDisplay(); // Alle 9 Teile sichtbar
            this._celebratePuzzleComplete();
            return; // Nicht weiter — Feier übernimmt den Rest
        }

        // Alle Puzzles durchgespielt → beim letzten bleiben oder loopen
        if (this.currentPuzzle >= this.puzzleImages.length) {
            this.currentPuzzle = 0; // Von vorne beginnen
        }
        // Merke Index des neuen Teils
        const newPieceIndex = this.revealedPieces;
        this.revealedPieces++;
        this.saveProgress();
        // Zeige alle bisherigen Teile, aber NICHT das neue
        const pieces = document.querySelectorAll('.puzzle-piece');
        pieces.forEach((piece, index) => {
            if (index < newPieceIndex) {
                piece.classList.add('revealed');
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                const positions = [
                    '0% 0%', '50% 0%', '100% 0%',
                    '0% 50%', '50% 50%', '100% 50%',
                    '0% 100%', '50% 100%', '100% 100%'
                ];
                piece.style.backgroundPosition = positions[index];
            } else {
                piece.classList.remove('revealed');
                piece.style.backgroundImage = '';
                piece.style.backgroundSize = '';
                piece.style.backgroundPosition = '';
            }
        });
        // Neues Puzzleteil einfach direkt aufdecken
        setTimeout(() => {
            const piece = document.querySelector(`[data-piece="${newPieceIndex}"]`);
            if (piece) {
                piece.classList.add('revealed');
                piece.style.background = '';
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                const positions = [
                    '0% 0%', '50% 0%', '100% 0%',
                    '0% 50%', '50% 50%', '100% 50%',
                    '0% 100%', '50% 100%', '100% 100%'
                ];
                piece.style.backgroundPosition = positions[newPieceIndex];
            }
        }, 0);
    }

    updateDisplay() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        pieces.forEach((piece, index) => {
            if (index < this.revealedPieces) {
                piece.classList.add('revealed');
                piece.style.backgroundImage = `url(${this.puzzleImages[this.currentPuzzle]})`;
                piece.style.backgroundSize = '300% 300%';
                const positions = [
                    '0% 0%', '50% 0%', '100% 0%',
                    '0% 50%', '50% 50%', '100% 50%',
                    '0% 100%', '50% 100%', '100% 100%'
                ];
                piece.style.backgroundPosition = positions[index];
            } else {
                piece.classList.remove('revealed');
                piece.style.backgroundImage = '';
                piece.style.backgroundSize = '';
                piece.style.backgroundPosition = '';
            }
        });
    }

    saveProgress() {
        // Puzzle-Fortschritt wird nicht persistiert, da das Spiel immer frisch startet
    }

    hide() {
        const container = document.getElementById('puzzle-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    show() {
        const container = document.getElementById('puzzle-container');
        if (container) {
            container.style.display = 'block';
        }
    }

    _celebratePuzzleComplete() {
        const container = document.getElementById('puzzle-container');
        if (!container) return;
        this._isCelebrating = true;

        // Puzzle vergrößern und golden leuchten
        container.classList.add('expanded');
        container.style.transition = 'all 0.5s cubic-bezier(.4,1.3,.6,1)';
        container.style.boxShadow = '0 0 40px #FFD166, 0 0 80px #FFD16688';
        container.style.zIndex = '10000';

        // TTS Nachricht
        if (window.countObjectsGameInstance && window.countObjectsGameInstance.tts) {
            window.countObjectsGameInstance.tts.speak('Super, du hast das Puzzle geschafft!');
        }

        // Nach 3.5 Sekunden: Feier beenden, nächstes Puzzle vorbereiten
        setTimeout(() => {
            container.classList.remove('expanded');
            container.style.boxShadow = '';
            container.style.zIndex = '';
            container.style.transition = '';

            // Nächstes Puzzle
            this.currentPuzzle++;
            if (this.currentPuzzle >= this.puzzleImages.length) {
                this.currentPuzzle = 0;
            }
            this.revealedPieces = 0;
            this.updateDisplay();
            this._isCelebrating = false;
        }, 3500);
    }
} 