// === script.js: Zaehlspiel (nutzt shared.js) ===

// Kindgerechte, abwechslungsreiche TTS-Phrasen fuer das Zaehlspiel.
// Platzhalter: {name} (Plural-Name z.B. "Hunde"), {singular} (z.B. "ein Hund"),
// {count} (Ziffer), {zahlwort} (z.B. "drei"), {zahlwort_cap} ("Drei"),
// {guessed}, {guessed_zahlwort} (nur bei Wrong).
const COUNT_PHRASES = {
    instruction: [
        'Wie viele {name} siehst du?',
        'Zähl mal: wie viele {name} sind hier?',
        'Schau genau hin! Wie viele {name} entdeckst du?',
        'Kannst du die {name} zählen?',
        'Oh, {name}! Wie viele sind es?',
        'Hilf mir zählen: wie viele {name} siehst du?',
        'Jetzt aber: wie viele {name} sind das?',
        'Zeig mal mit dem Finger mit. Wie viele {name}?',
        'Na, wie viele {name} hast du entdeckt?',
        'Das sind ja ganz schön viele {name}. Wie viele denn?',
        'Da tummeln sich {name}. Zähl mal!',
        'Spannend! Wie viele {name} sind das?',
        'Mach mal deine Augen auf und zähl die {name}!',
        'Huch, {name}! Zähl mal, wie viele hier sind.',
        'Ich frage mich, wie viele {name} das wohl sind.',
        'Augen auf und losgezählt! Wie viele {name}?',
        'Hast du schon gezählt? Wie viele {name} sind es?',
        'Puh, sind das viele {name}! Wie viele denn?',
    ],
    correct: [
        'Ja genau! {zahlwort_cap} {name}!',
        'Richtig! Das waren {zahlwort} {name}!',
        'Super gemacht! {zahlwort_cap} {name}, genau richtig!',
        'Klasse, du hast richtig gezählt: {zahlwort} {name}!',
        'Wow, Volltreffer! {zahlwort_cap} {name}!',
        'Toll! Da sind tatsächlich {zahlwort} {name}.',
        'Juhu! {zahlwort_cap} {name}, das stimmt!',
        'Bravo! Das waren wirklich {zahlwort} {name}.',
        'Mega, richtig! {zahlwort_cap} {name}!',
        'Du bist ein richtiger Zählprofi! {zahlwort_cap} {name}!',
        'Hurra, Treffer! {zahlwort_cap} {name}!',
        'Genau, {zahlwort} {name}, du hast\'s drauf!',
        'Stark! {zahlwort_cap} {name}, ganz genau.',
        '{zahlwort_cap} {name}! Richtig erkannt!',
        'Yes! {zahlwort_cap} {name} sind es tatsächlich.',
        'Ganz genau so viele! {zahlwort_cap} {name}.',
        'Da hast du aber gut aufgepasst: {zahlwort} {name}!',
        'Perfekt! Ich zähle auch {zahlwort} {name}.',
    ],
    correct_one: [
        'Ja genau, {singular}!',
        'Richtig, da ist nur {singular}!',
        'Super, {singular}, stimmt genau!',
        'Klar, {singular} ist richtig!',
        'Bravo, das ist tatsächlich nur {singular}!',
        'Jawoll, {singular}, ganz allein!',
        'Ganz genau: {singular}, mehr ist\'s nicht.',
        'Richtig! Nur {singular} versteckt sich hier.',
        'Yep, {singular}. Volltreffer!',
        'Stimmt, da ist wirklich nur {singular}.',
    ],
    wrong: [
        'Oh, das passt noch nicht. Zähl nochmal nach!',
        'Hmm, nicht ganz. Zähl die {name} nochmal!',
        'Ups, daneben. Probier\'s nochmal!',
        'Hoppla, das war noch nicht richtig.',
        'Na, zähl mal ganz genau: wie viele sind es wirklich?',
        'Nicht ganz! Nimm den Finger und zähl einzeln.',
        'Noch nicht ganz. Versuch\'s nochmal!',
        'Schade, das war\'s nicht. Zähl in Ruhe nach!',
        'Hm hm, nochmal hinschauen!',
        'Fast! Aber zähl nochmal genau.',
        'Oh, das stimmt noch nicht. Eine nach der anderen!',
        'Nee, so viele sind es nicht. Zähl nochmal!',
        'Das war\'s noch nicht. Nochmal versuchen!',
        'Hmm, probier\'s nochmal. Zähl die {name} in Ruhe!',
        'Knapp daneben. Zähl nochmal mit dem Finger mit!',
        'Oh je, nicht ganz. Du schaffst das!',
        'Noch einen Versuch. Wie viele {name} sind es?',
    ],
    wrong_one: [
        'Nein, nur {singular} ist es nicht. Zähl nochmal!',
        'Oh, es ist nicht nur {singular}. Schau genau hin!',
        'Hm, mehr als {singular} sehe ich da. Zähl nochmal!',
    ],
    hint: [
        'Kleiner Tipp: Es sind {zahlwort}.',
        'Ich verrate es dir: {zahlwort_cap} {name} sind es.',
        'Pssst, es sind {zahlwort} {name}.',
        'Hier ist ein Tipp: {zahlwort_cap} {name}!',
        'Soll ich helfen? Es sind {zahlwort}.',
        'Magst du einen Tipp? Es sind {zahlwort} {name}.',
        'Die richtige Zahl ist {zahlwort}.',
        'Kleine Hilfe: zähle bis {zahlwort}.',
    ],
    welcome: [
        'Willkommen beim Zählspiel! Schau dir die Objekte an und drücke die richtige Zahl.',
        'Schön, dass du da bist! Zähl die Objekte und drück die richtige Zahl.',
        'Los geht\'s mit dem Zählen! Schau dir die Bilder an und finde die richtige Zahl.',
        'Hallo! Bereit zum Zählen? Drück einfach die passende Zahl.',
        'Hi! Heute üben wir Zählen. Drück die richtige Zahl.',
    ],
};

function _pickCountPhrase(list, vars = {}) {
    const tpl = list[Math.floor(Math.random() * list.length)];
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// === UIManager: UI- und DOM-Logik ===
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
        const maxObjects = this.game._getCurrentMaxObjects();
        this.game.state.correctAnswer = Math.floor(Math.random() * maxObjects) + 1;
        this.game.state.currentObjects = [];
        for (let i = 0; i < this.game.state.correctAnswer; i++) {
            this.game.state.currentObjects.push(category.emoji);
        }
        this.game.displayObjects();
        // TTS fire-and-forget: Instruktion parallel zur Anzeige sprechen,
        // nicht darauf warten, sonst blockiert der naechste Input.
        this.game.speakInstruction();
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
            // Skip-Handler VOR TTS registrieren, damit Leertaste instant reagiert
            let animationSkipped = false;
            const skipToNext = () => {
                if (animationSkipped) return;
                animationSkipped = true;
                document.removeEventListener('keydown', skipKeyHandler);
                document.removeEventListener('click', skipClickHandler);
                // Laufende TTS abbrechen, damit der Wechsel sich instant anfuehlt
                if (this.game.tts && typeof this.game.tts._stop === 'function') this.game.tts._stop();
                if (window.speechSynthesis) window.speechSynthesis.cancel();
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

            // Sound, TTS (fire-and-forget) und Effekte zeitgleich starten
            this.game.playSound('success');
            this.game.speakSuccess();
            this.game.celebrateObjects();
            this.game.puzzle.revealNextPiece();

            setTimeout(() => {
                if (!animationSkipped) {
                    this.game.ui.showCelebration(this.game.state.correctAnswer, () => {
                        skipToNext();
                    });
                }
            }, 1000);
        } else {
            this.game.state.wrongStreak++;
            // Sound und Shake sofort; TTS fire-and-forget parallel
            this.game.playSound('wrong');
            this.game.shakeObjects();
            const willHint = this.game.state.wrongStreak >= 3;
            // Phrasen wie "Zähl nochmal nach!" brauchen die Aufgabe danach wirklich wieder
            Promise.resolve(this.game.speakWrong(number)).then(() => {
                if (!willHint) this.game.speakInstruction();
            });
            // Nach 3 Fehlversuchen: Hinweis geben
            if (willHint) {
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
        this.tts = PiperTTSManager.getShared();
        this.music = new MusicManager(SHARED_MUSIC_TRACKS, SHARED_MUSIC_COVERS);
        this.ui = new UIManager(this);
        this.logic = new GameLogic(this);
        this.puzzle = PuzzleManager.getShared();
        this.init();
    }

    getAudioContext() {
        return SharedAudio.getContext();
    }

    init() {
        console.log('Spiel wird initialisiert...');
        this.bindEvents();
        // Das Spiel wird erst nach dem Klick auf "Spiel starten" initialisiert
        console.log('Startscreen wird angezeigt');
    }

    _playStartSound() {
        SharedAudio.playStartSound();
    }

    _triggerStartTransition() {
        this._playStartSound();
        const startscreen = document.getElementById('startscreen');
        startscreen.classList.add('hide');
        setTimeout(() => {
            this.startGame();
            startscreen.classList.remove('hide');
        }, 600);
    }

    bindEvents() {
        // Spielauswahl-Button "Zaehlen"
        const countingBtn = document.querySelector('[data-game="counting"]');
        if (countingBtn) {
            countingBtn.addEventListener('click', () => {
                this._triggerStartTransition();
            });
        }
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

    _buildVoiceOptions(current) {
        const opts = GOOGLE_CHIRP_VOICES.map(v =>
            `<option value="${v.id}" ${v.id === current ? 'selected' : ''}>${v.label}</option>`);
        if (!GOOGLE_CHIRP_VOICES.find(v => v.id === current)) {
            opts.unshift(`<option value="${current}" selected>${current} (eigene)</option>`);
        }
        return opts.join('');
    }

    _showParentMenu() {
        const overlay = document.createElement('div');
        overlay.id = 'parent-menu-overlay';
        overlay.className = 'parent-overlay';
        const panel = document.createElement('div');
        panel.className = 'parent-panel';

        const currentMax = this._getCurrentMaxObjects();
        const currentVolPct = Math.round((this.music.volume ?? 0.25) * 100);
        let newLevel = this.state.level;
        let newMaxOverride = currentMax;
        let newBackend = this.tts.backend;
        let newGoogleKey = this.tts.googleKey;
        let newGoogleVoice = this.tts.googleVoice;

        panel.innerHTML = `
            <div class="parent-panel-header">
                <h2 class="parent-panel-title">⚙️ Eltern-Einstellungen</h2>
                <div class="parent-panel-subtitle">Lange auf die Level-Zahl drücken zum Öffnen.</div>
            </div>
            <div class="parent-panel-body">
                <section class="parent-section">
                    <div class="parent-section-label">Inhalt</div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Startschwierigkeit</span>
                            <span class="parent-field-value" id="parent-diff-val">max. ${currentMax}</span>
                        </div>
                        <input type="range" id="parent-diff-slider" min="2" max="9" value="${currentMax}">
                        <div class="parent-helper">Maximale Anzahl an Objekten, die gezeigt werden.</div>
                    </div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Level</span>
                        </div>
                        <div class="parent-stepper">
                            <button type="button" id="parent-level-down" aria-label="Level runter">−</button>
                            <span class="parent-stepper-value" id="parent-level-val">${this.state.level}</span>
                            <button type="button" id="parent-level-up" aria-label="Level hoch">+</button>
                        </div>
                    </div>
                </section>
                <section class="parent-section">
                    <div class="parent-section-label">Audio</div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Musik-Lautstärke</span>
                            <span class="parent-field-value" id="parent-vol-val">${currentVolPct}%</span>
                        </div>
                        <input type="range" id="parent-vol-slider" min="0" max="100" value="${currentVolPct}">
                    </div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Stimme</span>
                        </div>
                        <div class="parent-voice-options">
                            <label class="parent-voice-option">
                                <input type="radio" name="parent-voice" value="piper" ${newBackend === 'piper' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Piper / Thorsten</span>
                                    <span class="parent-helper">Offline, gratis. ~63 MB Download beim ersten Start.</span>
                                </span>
                            </label>
                            <label class="parent-voice-option">
                                <input type="radio" name="parent-voice" value="google" ${newBackend === 'google' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Google Chirp 3 HD</span>
                                    <span class="parent-helper">Premium-Qualität. Eigener API-Key nötig (100k Zeichen/Monat gratis).</span>
                                </span>
                            </label>
                            <label class="parent-voice-option">
                                <input type="radio" name="parent-voice" value="browser" ${newBackend === 'browser' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Browser-Stimme</span>
                                    <span class="parent-helper">Eingebaut, Qualität variiert je nach Gerät.</span>
                                </span>
                            </label>
                        </div>
                        <div class="parent-voice-google" id="parent-google-config" ${newBackend === 'google' ? '' : 'hidden'}>
                            <input type="password" id="parent-google-key" class="parent-text-input" placeholder="Google API-Key" value="${newGoogleKey}" autocomplete="off">
                            <select id="parent-google-voice" class="parent-text-input">
                                ${this._buildVoiceOptions(newGoogleVoice)}
                            </select>
                            <button type="button" class="parent-btn parent-btn-secondary parent-btn-slim" id="parent-google-test">Testen</button>
                            <div class="parent-helper">
                                Key auf <code>console.cloud.google.com</code> erstellen, „Text-to-Speech API" aktivieren. Key per HTTP-Referrer auf deine Domain beschränken. Wird nur im Browser gespeichert.
                            </div>
                        </div>
                        <div class="parent-status" id="parent-tts-status"></div>
                    </div>
                </section>
            </div>
            <div class="parent-panel-footer">
                <button type="button" class="parent-btn parent-btn-secondary" id="parent-menu-close">Abbrechen</button>
                <button type="button" class="parent-btn parent-btn-primary" id="parent-menu-apply">Übernehmen</button>
            </div>
        `;
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        const slider = document.getElementById('parent-diff-slider');
        const diffVal = document.getElementById('parent-diff-val');
        slider.addEventListener('input', () => {
            newMaxOverride = parseInt(slider.value);
            diffVal.textContent = 'max. ' + newMaxOverride;
        });

        const volSlider = document.getElementById('parent-vol-slider');
        const volVal = document.getElementById('parent-vol-val');
        volSlider.addEventListener('input', () => {
            const pct = parseInt(volSlider.value);
            volVal.textContent = pct + '%';
            this.music.setVolume(pct / 100);
        });

        const levelVal = document.getElementById('parent-level-val');
        document.getElementById('parent-level-down').addEventListener('click', () => {
            if (newLevel > 1) { newLevel--; levelVal.textContent = newLevel; }
        });
        document.getElementById('parent-level-up').addEventListener('click', () => {
            newLevel++; levelVal.textContent = newLevel;
        });

        let statusTimer = null;
        const cleanup = () => {
            if (statusTimer) clearInterval(statusTimer);
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        };
        const keyHandler = (e) => {
            if (e.key === 'Escape') cleanup();
        };
        document.addEventListener('keydown', keyHandler);

        const statusEl = document.getElementById('parent-tts-status');
        const renderStatus = () => {
            if (!statusEl) return;
            statusEl.classList.remove('ready', 'fallback');
            if (newBackend === 'browser') {
                statusEl.textContent = '● Browser-Stimme aktiv';
                statusEl.classList.add('ready'); return;
            }
            if (newBackend === 'google') {
                const gs = this.tts.googleStatus;
                if (!newGoogleKey) { statusEl.textContent = '○ Kein API-Key eingetragen'; statusEl.classList.add('fallback'); return; }
                if (gs === 'ready') { statusEl.textContent = '● Google-Stimme bereit'; statusEl.classList.add('ready'); return; }
                if (gs === 'error') { statusEl.textContent = '○ API-Fehler – Browser-Fallback aktiv'; statusEl.classList.add('fallback'); return; }
                statusEl.textContent = '○ Noch nicht getestet'; return;
            }
            const s = this.tts.status;
            if (s === 'ready') { statusEl.textContent = '● Piper/Thorsten bereit'; statusEl.classList.add('ready'); }
            else if (s === 'downloading') statusEl.textContent = `⬇ Modell lädt … ${Math.round((this.tts.progress || 0) * 100)}%`;
            else if (s === 'fallback') { statusEl.textContent = '○ Nicht verfügbar – Browser-Stimme aktiv'; statusEl.classList.add('fallback'); }
            else statusEl.textContent = '○ Initialisiert …';
        };
        renderStatus();
        statusTimer = setInterval(renderStatus, 500);

        const googleConfig = document.getElementById('parent-google-config');
        overlay.querySelectorAll('input[name="parent-voice"]').forEach(r => {
            r.addEventListener('change', () => {
                newBackend = r.value;
                if (googleConfig) googleConfig.toggleAttribute('hidden', newBackend !== 'google');
                renderStatus();
            });
        });
        const keyInput = document.getElementById('parent-google-key');
        const voiceInput = document.getElementById('parent-google-voice');
        keyInput.addEventListener('input', () => { newGoogleKey = keyInput.value.trim(); renderStatus(); });
        voiceInput.addEventListener('change', () => { newGoogleVoice = voiceInput.value || 'de-DE-Chirp3-HD-Leda'; });
        document.getElementById('parent-google-test').addEventListener('click', async () => {
            const saved = this.tts.backend;
            this.tts.setGoogleKey(newGoogleKey);
            this.tts.setGoogleVoice(newGoogleVoice);
            this.tts.backend = 'google';
            await this.tts.speak('Hallo, ich bin deine neue Stimme.');
            this.tts.backend = saved;
            renderStatus();
        });

        document.getElementById('parent-menu-apply').addEventListener('click', () => {
            this.state.level = newLevel;
            this.state.maxObjectsOverride = newMaxOverride;
            this.tts.setGoogleKey(newGoogleKey);
            this.tts.setGoogleVoice(newGoogleVoice);
            this.tts.setBackend(newBackend);
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
        // Trail-Animation stoppen
        if (window._trailControl) window._trailControl.stop();
        // Verstecke Startscreen
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'none';
        startscreen.style.pointerEvents = 'none';
        // Zeige Spiel
        document.getElementById('game-container').style.display = '';
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
        if (!this.speechEnabled) return Promise.resolve();
        const { objName } = this._getObjectInfo();
        const text = _pickCountPhrase(COUNT_PHRASES.instruction, {
            name: objName,
            singular: this._getSingular(objName),
        });
        return this.tts.speak(text);
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
        const { numberNames, objName } = this._getObjectInfo();
        const count = this.state.correctAnswer;
        const zahlwort = numberNames[count - 1] || count.toString();
        const vars = {
            count,
            zahlwort,
            zahlwort_cap: zahlwort.charAt(0).toUpperCase() + zahlwort.slice(1),
            name: objName,
            singular: this._getSingular(objName),
        };
        const list = count === 1 ? COUNT_PHRASES.correct_one : COUNT_PHRASES.correct;
        return this.tts.speak(_pickCountPhrase(list, vars));
    }

    speakWrong(guessedNumber) {
        const { numberNames, objName } = this._getObjectInfo();
        const zahlwort = numberNames[guessedNumber - 1] || guessedNumber.toString();
        const vars = {
            guessed: guessedNumber,
            guessed_zahlwort: zahlwort,
            name: objName,
            singular: this._getSingular(objName),
        };
        const list = guessedNumber === 1 ? COUNT_PHRASES.wrong_one : COUNT_PHRASES.wrong;
        return this.tts.speak(_pickCountPhrase(list, vars));
    }

    nextLevel() {
        this.logic.nextLevel();
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        switch(type) {
            case 'success':
                this.playSuccessMelody();
                break;
            case 'wrong':
                this.playWrongSound();
                break;
        }
    }

    playSuccessMelody() {
        SharedAudio.playSuccessMelody();
    }

    playWrongSound() {
        SharedAudio.playWrongSound();
    }

    speakWelcome() {
        if (!this.speechEnabled) return;
        setTimeout(() => {
            this.tts.speak(_pickCountPhrase(COUNT_PHRASES.welcome));
        }, 500);
    }

    toggleMusic() {
        this.music.toggleMusic();
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

        // Trail-Animation wieder starten
        if (window._trailControl) window._trailControl.start();
    }

    _showHint() {
        const answer = this.state.correctAnswer;
        const { numberNames, objName } = this._getObjectInfo();
        const zahlwort = numberNames[answer - 1] || answer.toString();
        // TTS Hinweis (Variation)
        if (this.speechEnabled) {
            this.tts.speak(_pickCountPhrase(COUNT_PHRASES.hint, {
                count: answer,
                zahlwort,
                zahlwort_cap: zahlwort.charAt(0).toUpperCase() + zahlwort.slice(1),
                name: objName,
            }));
        }
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
        // Außerhalb des Viewports starten: keine Ruhe-Blase in der Bildmitte,
        // die die Aufmerksamkeit von den Spielauswahl-Kacheln wegzieht.
        for (let i = 0; i < NUM_POINTS; i++) {
            trail.push({ x: -9999, y: -9999 });
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

    let mouse = { x: -9999, y: -9999 };
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
            const ctx = SharedAudio.getContext();
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
        // Nicht ausloesen, wenn auf Spielauswahl-Buttons oder Video geklickt wurde
        const menu = document.getElementById('game-select-menu');
        const video = document.querySelector('.startscreen-video');
        if (menu && menu.contains(e.target)) return;
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

// --- Startscreen-Sprachansage (für Kinder, die noch nicht lesen) ---
(function() {
    function getTTS() {
        try { return PiperTTSManager.getShared(); } catch (e) { return null; }
    }
    let ctaSpoken = false;
    let lastSpokenAt = 0;
    function speak(text) {
        const tts = getTTS();
        if (!tts || !tts.enabled) return;
        // 600ms Debounce, damit Hover-Serien nicht stottern
        const now = performance.now();
        if (now - lastSpokenAt < 600) return;
        lastSpokenAt = now;
        try { tts.speak(text); } catch (e) {}
    }
    function speakCTA() {
        if (ctaSpoken) return;
        ctaSpoken = true;
        speak('Tipp ein Spiel!');
    }
    function isStartscreenVisible() {
        const s = document.getElementById('startscreen');
        return s && s.style.display !== 'none' && !s.classList.contains('hide');
    }

    document.addEventListener('DOMContentLoaded', () => {
        // CTA bei erster Interaktion ansagen (Autoplay-Policy verlangt Geste)
        const trigger = () => {
            if (!isStartscreenVisible()) return;
            speakCTA();
            window.removeEventListener('pointerdown', trigger, true);
            window.removeEventListener('touchstart', trigger, true);
            window.removeEventListener('mousemove', trigger, true);
            window.removeEventListener('keydown', trigger, true);
        };
        window.addEventListener('pointerdown', trigger, true);
        window.addEventListener('touchstart', trigger, true);
        window.addEventListener('mousemove', trigger, true);
        window.addEventListener('keydown', trigger, true);

        // Kachel-spezifische Ansage beim Hover/Fokus (vor allem Desktop)
        document.querySelectorAll('.game-select-btn[data-speak]').forEach(btn => {
            const label = btn.getAttribute('data-speak');
            const announce = () => {
                if (!isStartscreenVisible()) return;
                speak(label);
            };
            btn.addEventListener('mouseenter', announce);
            btn.addEventListener('focus', announce);
        });
    });
})();

// MusicOverlay und PuzzleManager sind jetzt in shared.js