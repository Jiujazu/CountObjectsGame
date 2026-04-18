// === letter-game.js: Buchstabenspiel (nutzt shared.js) ===

// Deutsche Anlauttabelle: Buchstabe -> Emoji + Wort
// Wortwahl kindgerecht: kurze, bekannte Substantive; lange Vokale vor Plosiven,
// damit der Anlaut nicht vom Folgekonsonanten ueberdeckt wird.
const ANLAUT_TABLE = {
    'A': { emoji: '🍎', word: 'Apfel' },
    'B': { emoji: '🐻', word: 'Bär' },
    'C': { emoji: '🤡', word: 'Clown' },
    'D': { emoji: '🐬', word: 'Delfin' },
    'E': { emoji: '🐘', word: 'Elefant' },
    'F': { emoji: '🐟', word: 'Fisch' },
    'G': { emoji: '🦒', word: 'Giraffe' },
    'H': { emoji: '🐶', word: 'Hund' },
    'I': { emoji: '🦔', word: 'Igel' },
    'J': { emoji: '🪁', word: 'Jojo' },
    'K': { emoji: '🐱', word: 'Katze' },
    'L': { emoji: '🦁', word: 'Löwe' },
    'M': { emoji: '🐭', word: 'Maus' },
    'N': { emoji: '👃', word: 'Nase' },
    'O': { emoji: '🦦', word: 'Otter' },
    'P': { emoji: '🐧', word: 'Pinguin' },
    'Q': { emoji: '🪼', word: 'Qualle' },
    'R': { emoji: '🚀', word: 'Rakete' },
    'S': { emoji: '☀️', word: 'Sonne' },
    'T': { emoji: '🐯', word: 'Tiger' },
    'U': { emoji: '🦉', word: 'Uhu' },
    'V': { emoji: '🐦', word: 'Vogel' },
    'W': { emoji: '🐋', word: 'Wal' },
    'X': { emoji: '🎸', word: 'Xylophon' },
    'Y': { emoji: '🧘', word: 'Yoga' },
    'Z': { emoji: '🦓', word: 'Zebra' },
    'Ä': { emoji: '🍏', word: 'Äpfel' },
    'Ö': { emoji: '🛢️', word: 'Öl' },
    'Ü': { emoji: '🎁', word: 'Überraschung' }
};

const ALL_LETTERS = Object.keys(ANLAUT_TABLE);

// Tier-basierte Presets nach Schwierigkeit fuer 3-4jaehrige (siehe UX-Review):
// - Starter (Tier 1): eindeutige, haeufige Konsonanten + klare Laute
// - Leicht (Tier 1+2): + einfache Vokale (Default fuer Erstkontakt)
// - Kern (Tier 1-3): + stimmhaft/stimmlos-Paare, E, Z, J
// - Komplett: alle 29 inkl. Homophon-Buchstaben (C/V/Y/Q/X) und Umlaute
const LETTER_PRESETS = {
    'Starter': ['F','H','K','L','M','N','P','R','T','W'],
    'Leicht':  ['A','F','H','I','K','L','M','N','O','P','R','T','U','W'],
    'Kern':    ['A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','R','T','U','W','Z'],
    'Komplett': [...ALL_LETTERS],
};
const DEFAULT_PRESET = 'Leicht';

const IS_TOUCH_DEVICE = (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

// Lautier-Mapping (Silbenmethode): Buchstabe -> Text, den TTS als Laut spricht.
// Vokale klingen ohnehin wie ihr Laut. Plosive (B/D/G/K/P/T) brauchen einen
// Kurzvokal-Anker, sonst nicht isoliert sprechbar. Dauerlaute werden verlaengert.
// Fuer C/V/Y/Q wird bewusst der Buchstaben-Name statt des Phonems verwendet,
// weil ihre Phoneme mit K/F/J kollidieren wuerden. Das Kind soll beim Hint
// nicht dieselbe Lautfolge hoeren wie beim falschen Buchstaben.
const LAUTIERT_MAP = {
    'A': 'A',
    'B': 'Buh',
    'C': 'Zeh',    // Buchstaben-Name [tseː] - Phonem [k] wuerde mit K kollidieren
    'D': 'Duh',
    'E': 'E',
    'F': 'Fff',
    'G': 'Guh',
    'H': 'Ha',
    'I': 'I',
    'J': 'Ja',     // J wie in Jojo = [j] - Y nutzt 'Ypsilon', daher keine Kollision
    'K': 'Kuh',
    'L': 'Lll',
    'M': 'Mmm',
    'N': 'Nnn',
    'O': 'O',
    'P': 'Puh',
    'Q': 'Kuh',    // Q fast nur in Qu-Kombi [kv] - fuer Kind wie K anfuehlen
    'R': 'Rrr',
    'S': 'Sss',
    'T': 'Tuh',
    'U': 'U',
    'V': 'Vau',    // Buchstaben-Name [faʊ̯] - Phonem [f] wuerde mit F kollidieren
    'W': 'Www',
    'X': 'Iks',
    'Y': 'Ypsilon', // Buchstaben-Name - Phonem [j] wuerde mit J/Jot kollidieren
    'Z': 'Tsss',
    'Ä': 'Ä',
    'Ö': 'Ö',
    'Ü': 'Ü',
};

// Kindgerechte, variierende TTS-Phrasen. Platzhalter: {word}, {letter}.
const TTS_PHRASES = {
    instruction: [
        '{word}. Mit welchem Buchstaben fängt {word} an?',
        'Hör gut zu: {word}. Welcher Buchstabe ist am Anfang?',
        '{word}. Welcher Buchstabe kommt ganz zuerst?',
        'Das Wort heißt {word}. Mit welchem Buchstaben beginnt es?',
        '{word}. Kannst du den ersten Buchstaben hören?',
        'Finde den ersten Buchstaben von {word}.',
    ],
    correct: [
        'Genau! {letter} wie {word}!',
        'Super gemacht! {word} beginnt mit {letter}!',
        'Richtig! Das ist ein {letter}, wie in {word}!',
        'Klasse! {letter} ist richtig!',
        'Toll! {word} fängt mit {letter} an!',
        'Bravo! {letter} wie {word}, genau richtig!',
    ],
    wrong: [
        'Hm, das war nicht der erste Buchstabe. Hör nochmal gut hin!',
        'Nicht ganz. Probier es nochmal!',
        'Das war\'s noch nicht. Versuch einen anderen Buchstaben!',
        'Ups, leider falsch. Hör nochmal genau hin!',
        'Noch nicht ganz richtig. Du schaffst das!',
    ],
    hint: [
        'Tipp: {word} beginnt mit {letter}.',
        'Hör mal: {word} fängt mit {letter} an.',
        'Am Anfang von {word} kommt ein {letter}.',
        'Der erste Buchstabe von {word} ist ein {letter}.',
    ],
};

function _pickTTS(kind, vars) {
    const list = TTS_PHRASES[kind];
    const tpl = list[Math.floor(Math.random() * list.length)];
    return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

class LetterGame {
    constructor() {
        this.state = {
            level: 1,
            currentLetter: '',
            wrongStreak: 0,
            isProcessing: false,
            activeLetters: LetterGame._loadActiveLetters(),
            // Virtuelle Tastatur: auf Touch-Geraeten standardmaessig AN (sonst keine Eingabe moeglich),
            // am Desktop AUS (physische Tastatur verfuegbar). Elternmenue ueberschreibt das persistent.
            showVirtualKeyboard: LetterGame._loadFlag('letter-vkb', IS_TOUCH_DEVICE),
            showWord: false, // Wort als Spoiler ausblenden; wird bei richtiger Antwort eingeblendet
            // Silbenmethode standardmaessig AN: Vorschulkinder lernen Buchstaben ueber Laute ("Buh"),
            // nicht ueber Namen ("Be"). Nur AUS, wenn Eltern explizit deaktivieren.
            lautierEnabled: LetterGame._loadFlag('letter-lautiert', true),
        };
        this.soundEnabled = true;
        this.speechEnabled = true;
        this.tts = PiperTTSManager.getShared();
        this.music = new MusicManager(SHARED_MUSIC_TRACKS, SHARED_MUSIC_COVERS);
        this.puzzle = PuzzleManager.getShared();
        this._keydownHandler = null;
        this._eventsBound = false;
        this._pendingTimeouts = new Set();
        this._parentMenuCleanup = null;
    }

    static _loadFlag(key, defaultValue) {
        const saved = localStorage.getItem(key);
        if (saved === null) return defaultValue;
        return saved === 'true';
    }

    static _loadActiveLetters() {
        const saved = localStorage.getItem('letter-active');
        if (saved) {
            try {
                const arr = JSON.parse(saved);
                const valid = Array.isArray(arr) && arr.every(l => ALL_LETTERS.includes(l));
                if (valid && arr.length >= 2) return arr;
            } catch (e) { /* fallthrough to default */ }
        }
        return [...LETTER_PRESETS[DEFAULT_PRESET]];
    }

    _setTimeout(fn, ms) {
        const id = setTimeout(() => {
            this._pendingTimeouts.delete(id);
            fn();
        }, ms);
        this._pendingTimeouts.add(id);
        return id;
    }

    _clearPendingTimeouts() {
        this._pendingTimeouts.forEach(id => clearTimeout(id));
        this._pendingTimeouts.clear();
    }

    _triggerStartTransition() {
        SharedAudio.playStartSound();
        const startscreen = document.getElementById('startscreen');
        startscreen.classList.add('hide');
        setTimeout(() => {
            this.startGame();
            startscreen.classList.remove('hide');
        }, 600);
    }

    init() {
        const lettersBtn = document.querySelector('[data-game="letters"]');
        if (lettersBtn) {
            lettersBtn.addEventListener('click', () => {
                this._triggerStartTransition();
            });
        }
        // Breakout-Button -> breakout.html
        const breakoutBtn = document.querySelector('[data-game="breakout"]');
        if (breakoutBtn) {
            breakoutBtn.addEventListener('click', () => {
                SharedAudio.playStartSound();
                window.location.href = 'breakout.html';
            });
        }
    }

    async startGame() {
        // Trail-Animation stoppen
        if (window._trailControl) window._trailControl.stop();
        // Startscreen verstecken
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'none';
        startscreen.style.pointerEvents = 'none';
        // Buchstabenspiel anzeigen
        document.getElementById('letter-game-container').style.display = 'block';
        // Puzzle zeigen
        this.puzzle.show();
        // On-Screen Keyboard aufbauen
        this._buildKeyboard();
        // Events binden
        this._bindGameEvents();
        // Erste Challenge
        await this._createChallenge();
        this._updateLevelIndicator();
        this._updateStars();
        // Musik starten
        this.music.playBackgroundMusic();
        // TTS-Instanz global setzen
        window._sharedTTS = this.tts;
    }

    _buildKeyboard() {
        const container = document.getElementById('letter-keyboard');
        container.innerHTML = '';
        container.style.display = this.state.showVirtualKeyboard ? '' : 'none';
        this.state.activeLetters.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'letter-key';
            btn.textContent = letter;
            btn.dataset.letter = letter;
            btn.setAttribute('aria-label', `Buchstabe ${letter}`);
            btn.addEventListener('click', () => this._handleLetterClick(letter));
            container.appendChild(btn);
        });
    }

    _bindGameEvents() {
        if (this._eventsBound) return;
        this._eventsBound = true;
        // Tastatur
        this._keydownHandler = (e) => this._handleKeyDown(e);
        document.addEventListener('keydown', this._keydownHandler);
        // Control-Buttons
        const controls = [
            { id: 'letter-close-btn', fn: () => this.closeGame() },
            { id: 'letter-music-toggle', fn: () => this.music.toggleMusic() },
            { id: 'letter-tracklist-toggle', fn: () => this.music.showOverlay() },
            { id: 'letter-prev-track', fn: () => this.music.prevTrack() },
            { id: 'letter-next-track', fn: () => this.music.nextTrack() },
            { id: 'letter-replay-btn', fn: () => this._speakInstruction() },
            { id: 'letter-hint-btn', fn: () => this._showHint() },
        ];
        controls.forEach(({ id, fn }) => {
            const el = document.getElementById(id);
            if (el) {
                el._clickHandler = fn;
                el.addEventListener('click', el._clickHandler);
            }
        });
        // Eltern-Menu (Long-Press auf Level-Indikator)
        this._initParentMenu();
    }

    _unbindGameEvents() {
        if (!this._eventsBound) return;
        this._eventsBound = false;
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
        const ids = ['letter-close-btn', 'letter-music-toggle', 'letter-tracklist-toggle',
                     'letter-prev-track', 'letter-next-track', 'letter-replay-btn', 'letter-hint-btn'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && el._clickHandler) {
                el.removeEventListener('click', el._clickHandler);
            }
        });
    }

    async _createChallenge() {
        // Zufaelligen Buchstaben waehlen
        const letters = this.state.activeLetters;
        this.state.currentLetter = letters[Math.floor(Math.random() * letters.length)];
        this.state.wrongStreak = 0;
        this.state.isProcessing = false;
        const entry = ANLAUT_TABLE[this.state.currentLetter];
        // Display aktualisieren. Wort wird zunaechst versteckt, damit der Anfangsbuchstabe nicht verraten wird.
        const display = document.getElementById('letter-display');
        const wordClass = this.state.showWord ? 'letter-word' : 'letter-word hidden';
        display.innerHTML = `
            <div class="letter-emoji">${entry.emoji}</div>
            <div class="${wordClass}">${entry.word}</div>
        `;
        // Antwort-Slot
        const answerArea = document.getElementById('letter-answer-area');
        answerArea.innerHTML = '<div class="answer-slot" id="answer-slot"></div>';
        // Keyboard-Keys zuruecksetzen
        document.querySelectorAll('.letter-key').forEach(k => {
            k.classList.remove('correct', 'wrong', 'hint-flash');
        });
        // Instruktion sprechen
        await this._speakInstruction();
    }

    _letterForSpeech(letter) {
        if (!this.state.lautierEnabled) return letter;
        return LAUTIERT_MAP[letter] || letter;
    }

    async _speakInstruction() {
        if (!this.speechEnabled) return;
        const entry = ANLAUT_TABLE[this.state.currentLetter];
        await this.tts.speak(_pickTTS('instruction', { word: entry.word, letter: this.state.currentLetter }));
    }

    async _handleLetterClick(letter) {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        const slot = document.getElementById('answer-slot');
        slot.textContent = letter;
        slot.classList.add('filled');

        if (letter === this.state.currentLetter) {
            // Richtig!
            this.state.wrongStreak = 0;
            slot.classList.add('correct');
            // Wort zeigen (falls zuvor versteckt), damit das Kind sieht, welches Wort es war
            const wordEl = document.querySelector('.letter-word');
            if (wordEl) wordEl.classList.remove('hidden');
            // Key markieren
            const key = document.querySelector(`.letter-key[data-letter="${letter}"]`);
            if (key) key.classList.add('correct');
            // Sound & TTS
            if (this.soundEnabled) SharedAudio.playSuccessMelody();
            if (this.speechEnabled) {
                await this.tts.speak(_pickTTS('correct', { letter: this._letterForSpeech(letter), word: ANLAUT_TABLE[letter].word }));
            }
            // Puzzle Fortschritt
            this.puzzle.revealNextPiece();
            // Naechstes Level nach kurzer Pause
            this._setTimeout(async () => {
                slot.classList.remove('correct', 'filled');
                slot.textContent = '';
                this.state.level++;
                this._updateLevelIndicator();
                this._updateStars();
                await this._createChallenge();
            }, 1200);
        } else {
            // Falsch
            this.state.wrongStreak++;
            slot.classList.add('wrong');
            const key = document.querySelector(`.letter-key[data-letter="${letter}"]`);
            if (key) key.classList.add('wrong');
            if (this.soundEnabled) SharedAudio.playWrongSound();
            document.body.classList.add('flash-wrong');
            this._setTimeout(() => {
                slot.classList.remove('wrong', 'filled');
                slot.textContent = '';
                document.body.classList.remove('flash-wrong');
                if (key) key.classList.remove('wrong');
            }, 800);
            if (this.speechEnabled) {
                await this.tts.speak(_pickTTS('wrong', {}));
                // Phrasen wie "Hör nochmal gut hin!" brauchen eine Wiederholung
                if (this.state.wrongStreak < 3) {
                    await this._speakInstruction();
                }
            }
            if (this.state.wrongStreak >= 3) {
                this.state.wrongStreak = 0;
                this._showHint();
            }
            this.state.isProcessing = false;
        }
    }

    _handleKeyDown(e) {
        // Modifier-Kombinationen (Strg+S, Cmd+A, AltGr) nicht als Buchstabe werten
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            this.closeGame();
            return;
        }
        // Keine Buchstaben-Shortcuts, sonst kollidieren Musik/Hinweis mit M/H-Raten.
        // Musik & Hinweis bleiben ueber die On-Screen-Buttons erreichbar.
        // Buchstaben-Eingabe
        const letter = e.key.toUpperCase();
        if (ALL_LETTERS.includes(letter) && this.state.activeLetters.includes(letter)) {
            e.preventDefault();
            this._handleLetterClick(letter);
        }
    }

    _showHint() {
        const letter = this.state.currentLetter;
        const entry = ANLAUT_TABLE[letter];
        // Bei Hinweis immer das Wort zeigen (haeufige Fehlversuche → volle Unterstuetzung)
        const wordEl = document.querySelector('.letter-word');
        if (wordEl) wordEl.classList.remove('hidden');
        // TTS Hinweis nur wenn Sprache aktiviert
        if (this.speechEnabled) {
            this.tts.speak(_pickTTS('hint', { word: entry.word, letter: this._letterForSpeech(letter) }));
        }
        // Visueller Hinweis: richtigen Key blinken lassen
        const key = document.querySelector(`.letter-key[data-letter="${letter}"]`);
        if (key) {
            key.classList.remove('hint-flash');
            void key.offsetWidth; // reflow
            key.classList.add('hint-flash');
        }
        // Grossen Buchstaben anzeigen
        const hint = document.getElementById('big-key-hint');
        if (hint) {
            hint.innerHTML = `<span style="color:rgba(106,209,227,0.6);">${letter}</span>`;
            hint.classList.add('show');
            this._setTimeout(() => hint.classList.remove('show'), 2000);
        }
    }

    _updateLevelIndicator() {
        const indicator = document.getElementById('letter-level-indicator');
        if (indicator) indicator.textContent = this.state.level;
    }

    _updateStars() {
        const container = document.getElementById('letter-star-progress');
        if (!container) return;
        const earnedStars = Math.floor((this.state.level - 1) / 5);
        const totalStars = 7;
        container.innerHTML = '';
        for (let i = 0; i < totalStars; i++) {
            const star = document.createElement('span');
            star.className = 'star' + (i < earnedStars ? ' earned' : '');
            star.textContent = '\u2B50';
            container.appendChild(star);
        }
    }

    _initParentMenu() {
        const indicator = document.getElementById('letter-level-indicator');
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
        overlay.id = 'letter-parent-menu-overlay';
        overlay.className = 'parent-overlay';
        const panel = document.createElement('div');
        panel.className = 'parent-panel';

        // Presets nach Schwierigkeit (Anlauttabellen-UX-Review). Die Default-
        // Reihenfolge entspricht den Tiers aus dem Review: je weiter rechts,
        // desto mehr homophone/seltene Buchstaben enthalten.
        const presets = {
            'Starter': LETTER_PRESETS['Starter'],
            'Leicht': LETTER_PRESETS['Leicht'],
            'Kern': LETTER_PRESETS['Kern'],
            'Komplett': LETTER_PRESETS['Komplett'],
            'Vokale': ['A', 'E', 'I', 'O', 'U'],
            'Umlaute': ['Ä', 'Ö', 'Ü'],
        };
        let selectedLetters = [...this.state.activeLetters];
        let newShowVirtualKeyboard = this.state.showVirtualKeyboard;
        let newShowWord = this.state.showWord;
        let newLevel = this.state.level;
        let newBackend = this.tts.backend;
        let newGoogleKey = this.tts.googleKey;
        let newGoogleVoice = this.tts.googleVoice;
        let newLautierEnabled = this.state.lautierEnabled;
        const currentVolPct = Math.round((this.music.volume ?? 0.25) * 100);

        const presetHTML = Object.entries(presets).map(([name, letters]) => {
            const active = JSON.stringify(letters) === JSON.stringify(selectedLetters) ? ' active' : '';
            return `<button class="parent-preset${active}" data-preset="${name}">${name}</button>`;
        }).join('');

        const letterCheckboxes = ALL_LETTERS.map(l => {
            const checked = selectedLetters.includes(l) ? 'checked' : '';
            return `<label><input type="checkbox" data-letter-check="${l}" ${checked}> ${l}</label>`;
        }).join('');

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
                            <span class="parent-field-label">Buchstaben-Auswahl</span>
                            <span class="parent-field-value" id="lp-letter-count">${selectedLetters.length}/${ALL_LETTERS.length}</span>
                        </div>
                        <div class="parent-presets">${presetHTML}</div>
                        <details class="parent-letters">
                            <summary>Einzelne Buchstaben bearbeiten</summary>
                            <div class="parent-letters-grid">${letterCheckboxes}</div>
                        </details>
                    </div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Level</span>
                        </div>
                        <div class="parent-stepper">
                            <button type="button" id="lp-level-down" aria-label="Level runter">−</button>
                            <span class="parent-stepper-value" id="lp-level-val">${this.state.level}</span>
                            <button type="button" id="lp-level-up" aria-label="Level hoch">+</button>
                        </div>
                    </div>
                </section>
                <section class="parent-section">
                    <div class="parent-section-label">Anzeige</div>
                    <label class="parent-toggle">
                        <span class="parent-toggle-control"><input type="checkbox" id="lp-showword" ${newShowWord ? 'checked' : ''}></span>
                        <span class="parent-toggle-text">
                            <span class="parent-toggle-label">Wort von Anfang an zeigen</span>
                            <span class="parent-helper">Aus: Wort erscheint erst nach der richtigen Antwort.</span>
                        </span>
                    </label>
                    <label class="parent-toggle">
                        <span class="parent-toggle-control"><input type="checkbox" id="lp-vkb" ${newShowVirtualKeyboard ? 'checked' : ''}></span>
                        <span class="parent-toggle-text">
                            <span class="parent-toggle-label">Virtuelle Tastatur anzeigen</span>
                            <span class="parent-helper">Zusätzliche Tasten am Bildschirm für Geräte ohne Tastatur.</span>
                        </span>
                    </label>
                </section>
                <section class="parent-section">
                    <div class="parent-section-label">Audio</div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Musik-Lautstärke</span>
                            <span class="parent-field-value" id="lp-vol-val">${currentVolPct}%</span>
                        </div>
                        <input type="range" id="lp-vol-slider" min="0" max="100" value="${currentVolPct}">
                    </div>
                    <div class="parent-field">
                        <div class="parent-field-head">
                            <span class="parent-field-label">Stimme</span>
                        </div>
                        <div class="parent-voice-options">
                            <label class="parent-voice-option">
                                <input type="radio" name="lp-voice" value="piper" ${newBackend === 'piper' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Piper / Thorsten</span>
                                    <span class="parent-helper">Offline, gratis. ~63 MB Download beim ersten Start.</span>
                                </span>
                            </label>
                            <label class="parent-voice-option">
                                <input type="radio" name="lp-voice" value="google" ${newBackend === 'google' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Google Chirp 3 HD</span>
                                    <span class="parent-helper">Premium-Qualität. Eigener API-Key nötig (100k Zeichen/Monat gratis).</span>
                                </span>
                            </label>
                            <label class="parent-voice-option">
                                <input type="radio" name="lp-voice" value="browser" ${newBackend === 'browser' ? 'checked' : ''}>
                                <span class="parent-voice-text">
                                    <span class="parent-voice-label">Browser-Stimme</span>
                                    <span class="parent-helper">Eingebaut, Qualität variiert je nach Gerät.</span>
                                </span>
                            </label>
                        </div>
                        <div class="parent-voice-google" id="lp-google-config" ${newBackend === 'google' ? '' : 'hidden'}>
                            <input type="password" id="lp-google-key" class="parent-text-input" placeholder="Google API-Key" value="${newGoogleKey}" autocomplete="off">
                            <select id="lp-google-voice" class="parent-text-input">
                                ${this._buildVoiceOptions(newGoogleVoice)}
                            </select>
                            <button type="button" class="parent-btn parent-btn-secondary parent-btn-slim" id="lp-google-test">Testen</button>
                            <div class="parent-helper">
                                Key auf <code>console.cloud.google.com</code> erstellen, „Text-to-Speech API" aktivieren. Key per HTTP-Referrer auf deine Domain beschränken, damit er nicht missbraucht werden kann. Wird nur im Browser gespeichert.
                            </div>
                        </div>
                        <div class="parent-status" id="lp-tts-status"></div>
                    </div>
                    <label class="parent-toggle">
                        <span class="parent-toggle-control"><input type="checkbox" id="lp-lautiert" ${newLautierEnabled ? 'checked' : ''}></span>
                        <span class="parent-toggle-text">
                            <span class="parent-toggle-label">Lautiert aussprechen</span>
                            <span class="parent-helper">Silbenmethode: „Fff" statt „Eff", „Mmm" statt „Emm". So wie in der Schule.</span>
                        </span>
                    </label>
                </section>
            </div>
            <div class="parent-panel-footer">
                <button type="button" class="parent-btn parent-btn-secondary" id="lp-close">Abbrechen</button>
                <button type="button" class="parent-btn parent-btn-primary" id="lp-apply">Übernehmen</button>
            </div>
        `;
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        const countEl = document.getElementById('lp-letter-count');
        const updateCount = () => {
            if (countEl) countEl.textContent = `${selectedLetters.length}/${ALL_LETTERS.length}`;
        };
        const syncPresetActive = () => {
            overlay.querySelectorAll('.parent-preset').forEach(b => {
                const preset = presets[b.dataset.preset];
                const match = preset && JSON.stringify(preset) === JSON.stringify([...selectedLetters].sort((a, b) => a.localeCompare(b, 'de')));
                b.classList.toggle('active', !!match);
            });
        };

        overlay.querySelectorAll('.parent-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = presets[btn.dataset.preset];
                if (!preset) return;
                selectedLetters = [...preset];
                overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
                    cb.checked = selectedLetters.includes(cb.dataset.letterCheck);
                });
                overlay.querySelectorAll('.parent-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateCount();
            });
        });

        overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
            cb.addEventListener('change', () => {
                const l = cb.dataset.letterCheck;
                if (cb.checked) {
                    if (!selectedLetters.includes(l)) selectedLetters.push(l);
                    selectedLetters.sort((a, b) => a.localeCompare(b, 'de'));
                } else {
                    selectedLetters = selectedLetters.filter(x => x !== l);
                }
                updateCount();
                syncPresetActive();
            });
        });

        const levelVal = document.getElementById('lp-level-val');
        document.getElementById('lp-level-down').addEventListener('click', () => {
            if (newLevel > 1) { newLevel--; levelVal.textContent = newLevel; }
        });
        document.getElementById('lp-level-up').addEventListener('click', () => {
            newLevel++; levelVal.textContent = newLevel;
        });

        const statusEl = document.getElementById('lp-tts-status');
        const renderStatus = () => {
            if (!statusEl) return;
            statusEl.classList.remove('ready', 'fallback');
            if (newBackend === 'browser') {
                statusEl.textContent = '● Browser-Stimme aktiv';
                statusEl.classList.add('ready');
                return;
            }
            if (newBackend === 'google') {
                const gs = this.tts.googleStatus;
                if (!newGoogleKey) { statusEl.textContent = '○ Kein API-Key eingetragen'; statusEl.classList.add('fallback'); return; }
                if (gs === 'ready') { statusEl.textContent = '● Google-Stimme bereit'; statusEl.classList.add('ready'); return; }
                if (gs === 'error') { statusEl.textContent = '○ API-Fehler – Browser-Fallback aktiv'; statusEl.classList.add('fallback'); return; }
                statusEl.textContent = '○ Noch nicht getestet';
                return;
            }
            const s = this.tts.status;
            if (s === 'ready') { statusEl.textContent = '● Piper/Thorsten bereit'; statusEl.classList.add('ready'); }
            else if (s === 'downloading') statusEl.textContent = `⬇ Modell lädt … ${Math.round((this.tts.progress || 0) * 100)}%`;
            else if (s === 'fallback') { statusEl.textContent = '○ Nicht verfügbar – Browser-Stimme aktiv'; statusEl.classList.add('fallback'); }
            else statusEl.textContent = '○ Initialisiert …';
        };
        renderStatus();
        const statusTimer = setInterval(renderStatus, 500);

        const cleanup = () => {
            clearInterval(statusTimer);
            if (overlay.parentNode) overlay.remove();
            document.removeEventListener('keydown', keyHandler);
            this._parentMenuCleanup = null;
        };
        this._parentMenuCleanup = cleanup;
        const keyHandler = (e) => { if (e.key === 'Escape') cleanup(); };
        document.addEventListener('keydown', keyHandler);

        document.getElementById('lp-vkb').addEventListener('change', (e) => {
            newShowVirtualKeyboard = e.target.checked;
        });
        document.getElementById('lp-showword').addEventListener('change', (e) => {
            newShowWord = e.target.checked;
        });
        document.getElementById('lp-lautiert').addEventListener('change', (e) => {
            newLautierEnabled = e.target.checked;
        });

        // Musik-Lautstaerke live anwenden, damit man sofort den Unterschied hoert
        const volSlider = document.getElementById('lp-vol-slider');
        const volVal = document.getElementById('lp-vol-val');
        volSlider.addEventListener('input', () => {
            const pct = parseInt(volSlider.value);
            volVal.textContent = pct + '%';
            this.music.setVolume(pct / 100);
        });

        const googleConfig = document.getElementById('lp-google-config');
        overlay.querySelectorAll('input[name="lp-voice"]').forEach(r => {
            r.addEventListener('change', () => {
                newBackend = r.value;
                if (googleConfig) googleConfig.toggleAttribute('hidden', newBackend !== 'google');
                renderStatus();
            });
        });

        const keyInput = document.getElementById('lp-google-key');
        const voiceInput = document.getElementById('lp-google-voice');
        keyInput.addEventListener('input', () => {
            newGoogleKey = keyInput.value.trim();
            renderStatus();
        });
        voiceInput.addEventListener('change', () => {
            newGoogleVoice = voiceInput.value || 'de-DE-Chirp3-HD-Leda';
        });

        document.getElementById('lp-google-test').addEventListener('click', async () => {
            // Fuer den Test die aktuellen Eingaben uebernehmen, Backend auf google zwingen
            const savedBackend = this.tts.backend;
            this.tts.setGoogleKey(newGoogleKey);
            this.tts.setGoogleVoice(newGoogleVoice);
            this.tts.backend = 'google';
            await this.tts.speak('Hallo, ich bin deine neue Stimme.');
            this.tts.backend = savedBackend;
            renderStatus();
        });

        document.getElementById('lp-apply').addEventListener('click', () => {
            if (selectedLetters.length < 2) selectedLetters = [...LETTER_PRESETS[DEFAULT_PRESET]];
            this.state.activeLetters = selectedLetters;
            this.state.level = newLevel;
            this.state.showVirtualKeyboard = newShowVirtualKeyboard;
            this.state.showWord = newShowWord;
            this.state.lautierEnabled = newLautierEnabled;
            localStorage.setItem('letter-lautiert', newLautierEnabled ? 'true' : 'false');
            localStorage.setItem('letter-vkb', newShowVirtualKeyboard ? 'true' : 'false');
            localStorage.setItem('letter-active', JSON.stringify(selectedLetters));
            this.tts.setGoogleKey(newGoogleKey);
            this.tts.setGoogleVoice(newGoogleVoice);
            this.tts.setBackend(newBackend);
            this._buildKeyboard();
            this._updateLevelIndicator();
            this._updateStars();
            this._createChallenge();
            cleanup();
        });
        document.getElementById('lp-close').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
    }

    closeGame() {
        if (this.state.level > 1) {
            this._showCloseConfirmation();
            return;
        }
        this._doClose();
    }

    _showCloseConfirmation() {
        // Nicht-Leser: grosse Emoji-Buttons (gruener Pfeil weiterspielen, rotes Stop aufhoeren)
        // plus gesprochene Frage - der Text bleibt fuer Eltern sichtbar, ist aber nicht
        // die primaere Informationsquelle.
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:24px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:360px;';
        dialog.innerHTML = `
            <div style="font-size:3rem;margin-bottom:12px;">\uD83E\uDD14</div>
            <div style="font-size:1.15rem;font-weight:700;color:#232946;margin-bottom:20px;">Weiterspielen oder aufhören?</div>
            <div style="display:flex;gap:24px;justify-content:center;align-items:center;">
                <button id="letter-close-no" title="Weiterspielen" aria-label="Weiterspielen" style="background:#6AD1E3;color:#fff;border:none;border-radius:20px;width:96px;height:96px;font-size:3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">\u25B6\uFE0F</button>
                <button id="letter-close-yes" title="Aufhören" aria-label="Aufhören" style="background:#FF6F91;color:#fff;border:none;border-radius:20px;width:96px;height:96px;font-size:3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">\uD83D\uDED1</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        // Frage vorlesen, damit das Kind ohne Lesen entscheiden kann
        if (this.speechEnabled && this.tts) {
            this.tts.speak('Möchtest du weiterspielen oder aufhören?');
        }
        const cleanup = () => {
            overlay.remove();
            document.removeEventListener('keydown', kh);
        };
        const kh = (e) => {
            if (e.key === 'Escape') cleanup();
            if (e.key === 'Enter') { cleanup(); this._doClose(); }
        };
        document.addEventListener('keydown', kh);
        document.getElementById('letter-close-yes').addEventListener('click', () => { cleanup(); this._doClose(); });
        document.getElementById('letter-close-no').addEventListener('click', cleanup);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
    }

    _doClose() {
        // Ausstehende Timeouts (Next-Challenge, Wrong-Reset, Hint-Hide) stoppen
        this._clearPendingTimeouts();
        // Laufende Sprachausgabe abbrechen
        if (this.tts && typeof this.tts._stop === 'function') this.tts._stop();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        // Eltern-Menue schliessen falls offen
        if (this._parentMenuCleanup) this._parentMenuCleanup();
        // Visuelle Reste aufraeumen
        document.body.classList.remove('flash-wrong');
        document.querySelectorAll('.letter-key').forEach(k => k.classList.remove('hint-flash', 'correct', 'wrong'));
        const hint = document.getElementById('big-key-hint');
        if (hint) hint.classList.remove('show');
        this.music.stopBackgroundMusic();
        // Puzzle zuruecksetzen
        this.puzzle.currentPuzzle = 0;
        this.puzzle.revealedPieces = 0;
        this.puzzle.updateDisplay();
        this.puzzle.hide();
        // State zuruecksetzen
        this.state.level = 1;
        this.state.isProcessing = false;
        this.state.wrongStreak = 0;
        // UI zuruecksetzen
        document.getElementById('letter-game-container').style.display = 'none';
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'flex';
        startscreen.style.pointerEvents = 'auto';
        // Events loesen
        this._unbindGameEvents();
        // Trail-Animation wieder starten
        if (window._trailControl) window._trailControl.start();
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    window.letterGameInstance = new LetterGame();
    window.letterGameInstance.init();
});
