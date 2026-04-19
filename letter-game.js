// === letter-game.js: Buchstabenspiel (nutzt shared.js) ===

// Deutsche Anlauttabelle: Buchstabe -> Liste {emoji, word}.
// Auswahlregeln aus den UX-Reviews (Commits 60cb2ec, 0ac3ac0):
// - Vokale (A/E/I/O/U/Ä/Ö/Ü): langer Vokal vor Plosiven, damit der Anlaut
//   nicht vom Folgekonsonanten ueberdeckt wird (Ameise statt Apfel,
//   Adler [aː], Iglu [iː], Oma [oː], Uhr [uː]).
// - S: keine St-/Sp-/Sch-Woerter, da diese als "sht/shp/sh" gesprochen
//   werden und den reinen S-Laut nicht trainieren.
// - Homophon-Buchstaben (C/V/Y/Q/X) bleiben einzel-Eintrag: erscheinen nur
//   im "Komplett"-Preset und sollen keine zusaetzliche Verwirrung stiften.
// - Mehrere Varianten pro Buchstabe, damit dasselbe Kind nicht immer
//   dasselbe Wort hoert. Reihenfolge egal - Picker zieht zufaellig.
const ANLAUT_TABLE = {
    'A': [
        { emoji: '🐜', word: 'Ameise' },
        { emoji: '🦅', word: 'Adler' },
    ],
    'B': [
        { emoji: '🐻', word: 'Bär' },
        { emoji: '🌳', word: 'Baum' },
        { emoji: '⚽', word: 'Ball' },
    ],
    'C': [
        { emoji: '🤡', word: 'Clown' },
    ],
    'D': [
        { emoji: '🐬', word: 'Delfin' },
        { emoji: '🦕', word: 'Dino' },
    ],
    'E': [
        { emoji: '🐘', word: 'Elefant' },
    ],
    'F': [
        { emoji: '🐟', word: 'Fisch' },
        { emoji: '🦊', word: 'Fuchs' },
        { emoji: '🐸', word: 'Frosch' },
    ],
    'G': [
        { emoji: '🦒', word: 'Giraffe' },
        { emoji: '🎸', word: 'Gitarre' },
    ],
    'H': [
        { emoji: '🐶', word: 'Hund' },
        { emoji: '🐰', word: 'Hase' },
        { emoji: '🏠', word: 'Haus' },
    ],
    'I': [
        { emoji: '🦔', word: 'Igel' },
        { emoji: 'custom:iglu.svg', word: 'Iglu' },
    ],
    'J': [
        { emoji: '🪀', word: 'Jojo' },
        { emoji: '🧥', word: 'Jacke' },
    ],
    'K': [
        { emoji: '🐱', word: 'Katze' },
        { emoji: '🐮', word: 'Kuh' },
        { emoji: '👑', word: 'Krone' },
    ],
    'L': [
        { emoji: '🦁', word: 'Löwe' },
        { emoji: '🍭', word: 'Lolli' },
        { emoji: '💡', word: 'Lampe' },
    ],
    'M': [
        { emoji: '🐭', word: 'Maus' },
        { emoji: '🌙', word: 'Mond' },
        { emoji: '🐞', word: 'Marienkäfer' },
    ],
    'N': [
        { emoji: '👃', word: 'Nase' },
        { emoji: '🥜', word: 'Nuss' },
    ],
    'O': [
        { emoji: '👂', word: 'Ohr' },
        { emoji: '👵', word: 'Oma' },
    ],
    'P': [
        { emoji: '🐧', word: 'Pinguin' },
        { emoji: '🐼', word: 'Panda' },
        { emoji: '🍄', word: 'Pilz' },
    ],
    'Q': [
        { emoji: '🪼', word: 'Qualle' },
    ],
    'R': [
        { emoji: '🚀', word: 'Rakete' },
        { emoji: '🌈', word: 'Regenbogen' },
    ],
    'S': [
        { emoji: '☀️', word: 'Sonne' },
        { emoji: '🧦', word: 'Socke' },
    ],
    'T': [
        { emoji: '🐯', word: 'Tiger' },
        { emoji: '🍅', word: 'Tomate' },
    ],
    'U': [
        { emoji: '🦉', word: 'Uhu' },
        { emoji: '⌚', word: 'Uhr' },
    ],
    'V': [
        { emoji: '🐦', word: 'Vogel' },
    ],
    'W': [
        { emoji: '🐋', word: 'Wal' },
        { emoji: '☁️', word: 'Wolke' },
    ],
    'X': [
        { emoji: 'custom:xylophon.svg', word: 'Xylophon' },
    ],
    'Y': [
        { emoji: '🧘', word: 'Yoga' },
    ],
    'Z': [
        { emoji: '🦓', word: 'Zebra' },
        { emoji: '🚂', word: 'Zug' },
    ],
    'Ä': [
        { emoji: '🍏', word: 'Äpfel' },
    ],
    'Ö': [
        { emoji: '🛢️', word: 'Öl' },
    ],
    'Ü': [
        { emoji: '🎁', word: 'Überraschung' },
    ],
};

const ALL_LETTERS = Object.keys(ANLAUT_TABLE);

// Tier-basierte Presets nach Schwierigkeit fuer 3-4jaehrige (siehe UX-Review):
// - Starter (Tier 1): eindeutige, haeufige Konsonanten + klare Laute
// - Leicht (Tier 1+2): + einfache Vokale (Default fuer Erstkontakt)
// - Kern (Tier 1-3): + stimmhaft/stimmlos-Paare, E, Z, J
// - Komplett: alle 29 inkl. Homophon-Buchstaben (C/V/Y/Q/X) und Umlaute
const LETTER_PRESETS = {
    'Starter': ['F','H','K','L','M','N','P','R','T','W'],
    'Leicht':  ['A','F','H','I','K','L','M','N','O','P','R','S','T','U','W'],
    'Kern':    ['A','B','D','E','F','G','H','I','J','K','L','M','N','O','P','R','S','T','U','W','Z'],
    'Komplett': [...ALL_LETTERS],
};
const DEFAULT_PRESET = 'Leicht';

const IS_TOUCH_DEVICE = (typeof window !== 'undefined') &&
    (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

// Zentrale Timing-Konstanten (statt Magic Numbers verstreut im Code)
const TIMING = {
    NEXT_CHALLENGE_MS: 1200,   // Pause nach richtiger Antwort bevor naechster Buchstabe kommt
    WRONG_RESET_MS: 800,       // Rote Markierung des Falsch-Tipps sichtbar lassen
    HINT_SHOW_MS: 2000,        // Grosser Buchstaben-Hint fadet nach dieser Zeit
    START_TRANSITION_MS: 600,  // Startscreen -> Spiel Fade-Dauer
    STATUS_POLL_MS: 500,       // Eltern-Menue: TTS-Status-Refresh
};

// Kindgerechte, variierende TTS-Phrasen. Platzhalter: {word}, {letter}.
const TTS_PHRASES = {
    instruction: [
        '{word} - welcher Buchstabe?',
        '{word}. Wie fängt es an?',
        '{word}. Erster Buchstabe?',
        'Hör zu: {word}. Welcher Buchstabe?',
    ],
    correct: [
        'Genau! {letter} wie {word}!',
        'Super! {letter}!',
        'Richtig! {letter} wie {word}!',
        'Klasse, {letter}!',
        'Bravo! {letter} wie {word}!',
    ],
    wrong: [
        'Hör nochmal hin!',
        'Probier nochmal!',
        'Fast! Nochmal!',
        'Nicht ganz. Nochmal!',
    ],
    hint: [
        '{word} beginnt mit {letter}.',
        'Am Anfang: {letter}.',
        '{letter} wie {word}.',
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
            currentEntry: null,
            wrongStreak: 0,
            isProcessing: false,
            hasAnswered: false,     // Kind hat in aktueller Challenge schon getippt -> Space darf TTS skippen
            activeLetters: LetterGame._loadActiveLetters(),
            // Virtuelle Tastatur: auf Touch-Geraeten standardmaessig AN (sonst keine Eingabe moeglich),
            // am Desktop AUS (physische Tastatur verfuegbar). Elternmenue ueberschreibt das persistent.
            // Touch-Geraete brauchen die virtuelle Tastatur IMMER (ohne sie gibt
             // es keine Eingabemoeglichkeit). Gespeicherten "false"-Wert daher
             // dort ignorieren - sonst erbt das Handy eine Desktop-Einstellung
             // und das Kind sieht keine Eingabe.
            showVirtualKeyboard: IS_TOUCH_DEVICE ? true : LetterGame._loadFlag('letter-vkb', false),
            // Wort als Spoiler ausblenden; wird bei richtiger Antwort eingeblendet.
            // Persistiert, damit Eltern-Einstellung nach Reload erhalten bleibt.
            showWord: LetterGame._loadFlag('letter-showword', false),
        };
        this.soundEnabled = true;
        this.speechEnabled = true;
        this.tts = PiperTTSManager.getShared();
        this.music = new MusicManager(SHARED_MUSIC_TRACKS, SHARED_MUSIC_COVERS);
        this.puzzle = PuzzleManager.getShared();
        this._keydownHandler = null;
        this._eventsBound = false;
        this._pendingTimeouts = new Set();
        // Transientes Eltern-Menue: gesetzt solange Overlay offen ist,
        // gesammelte Listener + Poll-Timer werden bei _closeParentMenu entfernt.
        this._parentMenuTransient = null;
        // Shuffle-Bag-Zustand fuer zufaellige Buchstaben-/Wortauswahl ohne
        // Direkt-Wiederholungen. _letterBag ist eine gemischte Queue der
        // aktiven Buchstaben; _lastLetter verhindert Repeat ueber Bag-Grenze;
        // _lastWordIdx merkt pro Buchstabe das zuletzt gezogene Wort.
        this._letterBag = null;
        this._lastLetter = null;
        this._lastWordIdx = {};
    }

    _invalidateLetterBag() {
        this._letterBag = null;
    }

    // Zieht den naechsten Buchstaben aus einem Shuffle-Bag. Vorteil gegenueber
    // reinem Math.random(): jeder aktive Buchstabe kommt einmal pro Runde dran
    // (keine Haeufung), und es gibt keinen Direkt-Repeat beim Bag-Wechsel.
    _pickLetter() {
        const active = this.state.activeLetters;
        const stale = this._letterBag && this._letterBag.some(l => !active.includes(l));
        if (!this._letterBag || this._letterBag.length === 0 || stale) {
            const bag = [...active];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            if (bag.length > 1 && bag[0] === this._lastLetter) {
                [bag[0], bag[1]] = [bag[1], bag[0]];
            }
            this._letterBag = bag;
        }
        const letter = this._letterBag.shift();
        this._lastLetter = letter;
        return letter;
    }

    // Waehlt ein Wort fuer den Buchstaben und vermeidet dabei das zuletzt
    // benutzte - sonst fuehlt sich die Varianz bei 2-Wort-Buchstaben
    // (z.B. A: Ameise/Adler) trotz Math.random nach Alternierung an.
    _pickEntry(letter) {
        const options = ANLAUT_TABLE[letter];
        if (options.length === 1) return options[0];
        const lastIdx = this._lastWordIdx[letter];
        let idx;
        do {
            idx = Math.floor(Math.random() * options.length);
        } while (idx === lastIdx);
        this._lastWordIdx[letter] = idx;
        return options[idx];
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
        }, TIMING.START_TRANSITION_MS);
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
        // Persistente Audio-/Stimmeinstellungen laden (vor Musik-Start anwenden,
        // sonst spielt sie kurz auch bei deaktivierter Einstellung an).
        this.soundEnabled = localStorage.getItem('letter-sfx') !== 'false';
        this.speechEnabled = localStorage.getItem('letter-sfx') !== 'false';
        if (localStorage.getItem('letter-music') === 'false') {
            this.music.musicEnabled = false;
        }
        // Startscreen verstecken
        const startscreen = document.getElementById('startscreen');
        startscreen.style.display = 'none';
        startscreen.style.pointerEvents = 'none';
        // Buchstabenspiel anzeigen
        document.getElementById('letter-game-container').style.display = '';
        // Puzzle zeigen
        this.puzzle.show();
        // On-Screen Keyboard aufbauen
        this._buildKeyboard();
        // Events binden
        this._bindGameEvents();
        // Erste Challenge
        await this._createChallenge();
        this._updateLevelIndicator();
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
        // Control-Buttons (einheitliche Bottom-Controls + Home + Zahnrad)
        const controls = [
            { id: 'letter-home-btn', fn: () => this.closeGame() },
            { id: 'letter-tracklist-toggle', fn: () => this.music.showOverlay() },
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
        // Eltern-Menu: Zahnrad oeffnet das deklarative Overlay (keine Long-Press mehr)
        this._bindParentMenu();
    }

    _unbindGameEvents() {
        if (!this._eventsBound) return;
        this._eventsBound = false;
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
            this._keydownHandler = null;
        }
        const ids = ['letter-home-btn', 'letter-tracklist-toggle',
                     'letter-replay-btn', 'letter-hint-btn', 'letter-parent-btn'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el && el._clickHandler) {
                el.removeEventListener('click', el._clickHandler);
                delete el._clickHandler;
            }
        });
        // Offenes Eltern-Menue mit aufraeumen
        this._closeParentMenu();
    }

    async _createChallenge() {
        // Vor neuer Aufgabe: laufende Ansage (z.B. "Super, A wie Apfel") verwerfen,
        // damit sie nicht in die neue Instruktion hineinspricht.
        if (this.tts && typeof this.tts.cancel === 'function') this.tts.cancel();
        // Buchstabe via Shuffle-Bag + Wort ohne Direkt-Repeat ziehen
        this.state.currentLetter = this._pickLetter();
        this.state.currentEntry = this._pickEntry(this.state.currentLetter);
        this.state.wrongStreak = 0;
        this.state.isProcessing = false;
        this.state.hasAnswered = false;
        this._skipRequested = false;
        const entry = this.state.currentEntry;
        // Display aktualisieren. Wort wird zunaechst versteckt, damit der Anfangsbuchstabe nicht verraten wird.
        const display = document.getElementById('letter-display');
        const wordClass = this.state.showWord ? 'letter-word' : 'letter-word hidden';
        display.innerHTML = `
            <button type="button" class="letter-emoji" id="letter-emoji-btn" aria-label="Nochmal hören"></button>
            <div class="${wordClass}">${entry.word}</div>
        `;
        const emojiHost = document.getElementById('letter-emoji-btn');
        if (emojiHost) {
            emojiHost.appendChild(window.emojiImg(entry.emoji, entry.word, 'letter-emoji-img'));
        }
        // Emoji ist Haupt-Replay-Trigger: ein Kind, das die Sprachausgabe
        // verpasst hat, versucht instinktiv das Bild anzutippen. Der Mini-
        // 🔊-Button unten bleibt als redundanter Weg, ist aber sekundaer.
        const emojiBtn = document.getElementById('letter-emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this._speakInstruction());
        }
        // Antwort-Slot
        const answerArea = document.getElementById('letter-answer-area');
        answerArea.innerHTML = '<div class="answer-slot" id="answer-slot"></div>';
        // Keyboard-Keys zuruecksetzen
        document.querySelectorAll('.letter-key').forEach(k => {
            k.classList.remove('correct', 'wrong', 'hint-flash');
        });
        // Instruktion sprechen — NICHT awaiten, damit Musik/UI nicht blockiert
        // werden, falls TTS haengt (z.B. Piper-Download langsam).
        this._speakInstruction();
    }

    async _speakInstruction() {
        if (!this.speechEnabled) return;
        const entry = this.state.currentEntry;
        if (!entry) return;
        await this.tts.speak(_pickTTS('instruction', { word: entry.word, letter: this.state.currentLetter }));
    }

    async _handleLetterClick(letter) {
        if (this.state.isProcessing) return;
        this.state.isProcessing = true;
        this.state.hasAnswered = true;
        // Pro Versuch frisch: Space waehrend der Rueckmeldung setzt das Flag neu.
        this._skipRequested = false;
        // Kind hat getippt: laufende/gepufferte Ansagen abbrechen, sonst
        // ueberlappen die alten mit der neuen Rueckmeldung.
        if (this.tts && typeof this.tts.cancel === 'function') this.tts.cancel();
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
                await this.tts.speak(_pickTTS('correct', { letter, word: this.state.currentEntry.word }));
            }
            // Puzzle Fortschritt
            this.puzzle.revealNextPiece();
            // Gruener Success-Screen mit dem getroffenen Buchstaben. Einheitlich
            // ueber GameUI, damit Zaehl- und Letter-Spiel denselben Flow haben.
            slot.classList.remove('correct', 'filled');
            slot.textContent = '';
            GameUI.showSuccessScreen({
                content: letter,
                tts: this.speechEnabled ? this.tts : null,
                onNext: () => {
                    this.state.level++;
                    this._updateLevelIndicator();
                    this._createChallenge();
                }
            });
        } else {
            // Falsch
            this.state.wrongStreak++;
            // Einheitliches Fehler-Feedback (Shake + Ton) ueber GameUI.
            // TTS wird separat unten gesprochen (kontextabhaengig mit Re-Speak).
            GameUI.shakeError(slot, { audio: SharedAudio });
            const key = document.querySelector(`.letter-key[data-letter="${letter}"]`);
            if (key) key.classList.add('wrong');
            // Kein Full-Screen-Pink-Flash: fuer sensible Kinder zu abschreckend.
            this._setTimeout(() => {
                slot.classList.remove('wrong', 'filled');
                slot.textContent = '';
                if (key) key.classList.remove('wrong');
            }, TIMING.WRONG_RESET_MS);
            if (this.speechEnabled) {
                await this.tts.speak(_pickTTS('wrong', {}));
                // Phrasen wie "Hör nochmal gut hin!" brauchen eine Wiederholung,
                // solange wir noch nicht beim Hint sind.
                // Wenn das Kind Space gedrueckt hat, wollen wir NICHT nochmal
                // die Instruktion nachlegen, sonst frisst der Skip nur den
                // ersten Satz und die Stimme spricht trotzdem weiter.
                if (this.state.wrongStreak < 2 && !this._skipRequested) {
                    await this._speakInstruction();
                }
            }
            // 3-4jaehrige brechen nach 2 Fehlversuchen emotional ab, nicht erst nach 3.
            // Skip unterdrueckt den TTS-Hint zusaetzlich, visuell blinkt der Key trotzdem.
            if (this.state.wrongStreak >= 2 && !this._skipRequested) {
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
        // Leertaste: TTS-Skip nach erstem Versuch. Vor der ersten Antwort
        // bleibt Space inaktiv, damit die Start-Instruktion gehoert wird.
        // e.repeat + Cooldown verhindern, dass eine gedrueckt gehaltene
        // Leertaste Aufgabe nach Aufgabe wegskippt.
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return;
            if (!this.state.hasAnswered) return;
            const now = Date.now();
            if (this._skipLockUntil && now < this._skipLockUntil) return;
            this._skipLockUntil = now + 500;
            this._skipRequested = true;
            if (this.tts && typeof this.tts.cancel === 'function') this.tts.cancel();
            // Falls Skip waehrend der Wrong-Sequence kam, bleibt isProcessing
            // sonst bis zur zweiten await-Aufloesung true - das Kind koennte
            // erst nach Sekunden wieder tippen. Sofort freigeben.
            this.state.isProcessing = false;
            this._showSkipHint();
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

    _showSkipHint() {
        const hint = document.getElementById('big-key-hint');
        if (!hint) return;
        hint.innerHTML = '<span>⏭</span>';
        hint.classList.add('show');
        this._setTimeout(() => hint.classList.remove('show'), 900);
    }

    _showHint() {
        // Nach einem Hint soll das Kind wieder einen fairen ersten Versuch haben,
        // bevor der naechste Hint automatisch ausgeloest wird - egal ob der Hint
        // ueber den Button oder nach 2 Fehlversuchen getriggert wurde.
        this.state.wrongStreak = 0;
        const letter = this.state.currentLetter;
        const entry = this.state.currentEntry;
        // Wort NICHT automatisch einblenden: Pre-Reader kann es nicht lesen,
        // und der visuelle Gross-Buchstaben-Hint + die TTS-Ansage reichen.
        // TTS Hinweis nur wenn Sprache aktiviert
        if (this.speechEnabled) {
            this.tts.speak(_pickTTS('hint', { word: entry.word, letter }));
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
            hint.innerHTML = `<span class="hint-letter">${letter}</span>`;
            hint.classList.add('show');
            this._setTimeout(() => hint.classList.remove('show'), TIMING.HINT_SHOW_MS);
        }
    }

    _updateLevelIndicator() {
        const indicator = document.getElementById('letter-level-indicator');
        if (indicator) indicator.textContent = this.state.level;
    }

    _bindParentMenu() {
        // Eltern-Menue: nur das Zahnrad oeffnet das Overlay. Kein Long-Press
        // mehr auf der Level-Anzeige (reduziert Verwirrung fuer Nutzer, die
        // versehentlich lange tippen).
        const btn = document.getElementById('letter-parent-btn');
        if (!btn) return;
        btn._clickHandler = () => this._openParentMenu();
        btn.addEventListener('click', btn._clickHandler);
    }

    _openParentMenu() {
        const overlay = document.getElementById('letter-parent-overlay');
        if (!overlay) return;
        // Falls bereits offen: nichts tun (Doppeltaps abfangen).
        if (this._parentMenuTransient) return;
        overlay.classList.remove('hidden');

        // Eine Liste fuer Cleanup-Schritte; am Ende von _closeParentMenu
        // werden alle Listener und Timer entfernt.
        const cleanups = [];
        const addListener = (el, ev, fn, opts) => {
            if (!el) return;
            el.addEventListener(ev, fn, opts);
            cleanups.push(() => el.removeEventListener(ev, fn, opts));
        };

        // Preset-Definition (lokal zum Menu). Inhalt identisch zum alten Menue,
        // Vokale/Umlaute waren vorher nur Shortcuts - hier ebenso.
        const presets = {
            'Starter': LETTER_PRESETS['Starter'],
            'Leicht': LETTER_PRESETS['Leicht'],
            'Kern': LETTER_PRESETS['Kern'],
            'Komplett': LETTER_PRESETS['Komplett'],
            'Vokale': ['A', 'E', 'I', 'O', 'U'],
            'Umlaute': ['Ä', 'Ö', 'Ü'],
        };

        const gridEl = document.getElementById('lp-letter-grid');
        const countEl = document.getElementById('lp-letter-count');
        const levelVal = document.getElementById('lp-level-val');
        const levelDisplay = document.getElementById('lp-level-display');
        const showWordCb = document.getElementById('lp-showword');
        const vkbCb = document.getElementById('lp-vkb');
        const volSlider = document.getElementById('lp-vol-slider');
        const volVal = document.getElementById('lp-vol-val');
        const musicCb = document.getElementById('lp-music-toggle');
        const sfxCb = document.getElementById('lp-sfx-toggle');
        const statusEl = document.getElementById('lp-tts-status');
        const closeBtn = document.getElementById('lp-parent-close');

        // Grid mit 29 Checkboxen populieren (war beim Templating im JS, jetzt
        // deklarativ-befuellt: HTML stellt nur den Container).
        if (gridEl) {
            gridEl.innerHTML = ALL_LETTERS.map(l => {
                const checked = this.state.activeLetters.includes(l) ? 'checked' : '';
                return `<label><input type="checkbox" data-letter-check="${l}" ${checked}> ${l}</label>`;
            }).join('');
        }

        const updateCount = () => {
            if (countEl) countEl.textContent = `${this.state.activeLetters.length}/${ALL_LETTERS.length}`;
        };
        const syncPresetActive = () => {
            const sortedActive = JSON.stringify([...this.state.activeLetters].sort((a, b) => a.localeCompare(b, 'de')));
            overlay.querySelectorAll('.parent-preset').forEach(b => {
                const preset = presets[b.dataset.preset];
                if (!preset) { b.classList.remove('active'); return; }
                const sortedPreset = JSON.stringify([...preset].sort((a, b) => a.localeCompare(b, 'de')));
                b.classList.toggle('active', sortedPreset === sortedActive);
            });
        };
        const syncLetterCheckboxes = () => {
            overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
                cb.checked = this.state.activeLetters.includes(cb.dataset.letterCheck);
            });
        };

        // Initiale Feld-Werte aus State uebernehmen
        if (levelVal) levelVal.textContent = this.state.level;
        if (levelDisplay) levelDisplay.textContent = this.state.level;
        if (showWordCb) showWordCb.checked = this.state.showWord;
        if (vkbCb) vkbCb.checked = this.state.showVirtualKeyboard;
        const currentVolPct = Math.round((this.music.volume ?? 0.25) * 100);
        if (volSlider) volSlider.value = currentVolPct;
        if (volVal) volVal.textContent = currentVolPct + '%';
        if (musicCb) musicCb.checked = this.music.musicEnabled !== false;
        if (sfxCb) sfxCb.checked = this.soundEnabled;
        overlay.querySelectorAll('input[name="lp-voice"]').forEach(r => {
            r.checked = (r.value === this.tts.backend);
        });
        const googleKeyInput = document.getElementById('lp-google-key');
        const googleVoiceSel = document.getElementById('lp-google-voice');
        const googleTestBtn = document.getElementById('lp-google-test');
        const googleConfig = document.getElementById('lp-google-config');
        const setGoogleConfigVisible = () => {
            if (!googleConfig) return;
            if (this.tts.backend === 'google') googleConfig.classList.remove('hidden');
            else googleConfig.classList.add('hidden');
        };
        if (googleKeyInput) googleKeyInput.value = this.tts.googleKey || '';
        if (googleVoiceSel) {
            if (typeof GOOGLE_CHIRP_VOICES !== 'undefined') {
                googleVoiceSel.innerHTML = GOOGLE_CHIRP_VOICES
                    .map(v => `<option value="${v.id}">${v.label}</option>`).join('');
            }
            googleVoiceSel.value = this.tts.googleVoice || 'de-DE-Chirp3-HD-Leda';
        }
        setGoogleConfigVisible();
        updateCount();
        syncPresetActive();

        // Helper: wenn der aktuelle Buchstabe nicht mehr im aktiven Set ist,
        // muss eine neue Challenge erzeugt werden (sonst haengt das Kind auf
        // einem nicht mehr zulaessigen Buchstaben fest).
        const rebuildIfCurrentLetterGone = () => {
            if (!this.state.activeLetters.includes(this.state.currentLetter)) {
                this._createChallenge();
            }
        };

        // ---- Presets: setzen aktive Buchstaben LIVE ----
        overlay.querySelectorAll('.parent-preset').forEach(btn => {
            addListener(btn, 'click', () => {
                const preset = presets[btn.dataset.preset];
                if (!preset) return;
                this.state.activeLetters = [...preset];
                localStorage.setItem('letter-active', JSON.stringify(this.state.activeLetters));
                this._invalidateLetterBag();
                syncLetterCheckboxes();
                updateCount();
                syncPresetActive();
                this._buildKeyboard();
                rebuildIfCurrentLetterGone();
            });
        });

        // ---- Einzel-Checkboxen ----
        overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
            addListener(cb, 'change', () => {
                const l = cb.dataset.letterCheck;
                let letters = [...this.state.activeLetters];
                if (cb.checked) {
                    if (!letters.includes(l)) letters.push(l);
                    letters.sort((a, b) => a.localeCompare(b, 'de'));
                } else {
                    letters = letters.filter(x => x !== l);
                }
                // Mindestens zwei Buchstaben - sonst Default-Preset zurueckfordern.
                if (letters.length < 2) {
                    letters = [...LETTER_PRESETS[DEFAULT_PRESET]];
                    syncLetterCheckboxes();
                }
                this.state.activeLetters = letters;
                localStorage.setItem('letter-active', JSON.stringify(letters));
                this._invalidateLetterBag();
                updateCount();
                syncPresetActive();
                this._buildKeyboard();
                rebuildIfCurrentLetterGone();
            });
        });

        // ---- Level Stepper ----
        addListener(document.getElementById('lp-level-down'), 'click', () => {
            if (this.state.level > 1) {
                this.state.level--;
                if (levelVal) levelVal.textContent = this.state.level;
                if (levelDisplay) levelDisplay.textContent = this.state.level;
                this._updateLevelIndicator();
            }
        });
        addListener(document.getElementById('lp-level-up'), 'click', () => {
            this.state.level++;
            if (levelVal) levelVal.textContent = this.state.level;
            if (levelDisplay) levelDisplay.textContent = this.state.level;
            this._updateLevelIndicator();
        });

        // ---- Anzeige-Toggles ----
        addListener(showWordCb, 'change', () => {
            this.state.showWord = showWordCb.checked;
            localStorage.setItem('letter-showword', this.state.showWord ? 'true' : 'false');
            // Wort im aktuellen Display ein-/ausblenden, damit Aenderung sofort sichtbar ist.
            const wordEl = document.querySelector('.letter-word');
            if (wordEl) wordEl.classList.toggle('hidden', !this.state.showWord);
        });
        addListener(vkbCb, 'change', () => {
            this.state.showVirtualKeyboard = vkbCb.checked;
            localStorage.setItem('letter-vkb', this.state.showVirtualKeyboard ? 'true' : 'false');
            this._buildKeyboard();
        });

        // ---- Audio ----
        addListener(volSlider, 'input', () => {
            const pct = parseInt(volSlider.value, 10) || 0;
            if (volVal) volVal.textContent = pct + '%';
            this.music.setVolume(pct / 100);
        });
        addListener(musicCb, 'change', () => {
            // toggleMusic ist der "State-Flip" - nur aufrufen, wenn sich der
            // Zielwert tatsaechlich vom aktuellen unterscheidet.
            const wantOn = musicCb.checked;
            const isOn = this.music.musicEnabled !== false;
            if (wantOn !== isOn) {
                this.music.toggleMusic();
            }
            localStorage.setItem('letter-music', wantOn ? 'true' : 'false');
        });
        addListener(sfxCb, 'change', () => {
            // Effekte + Stimme sind fuer das Kind eine Einheit - gemeinsam steuern.
            this.soundEnabled = sfxCb.checked;
            this.speechEnabled = sfxCb.checked;
            localStorage.setItem('letter-sfx', sfxCb.checked ? 'true' : 'false');
        });

        // ---- Stimme (Google / Piper / Browser) ----
        overlay.querySelectorAll('input[name="lp-voice"]').forEach(r => {
            addListener(r, 'change', () => {
                if (r.checked) {
                    this.tts.setBackend(r.value);
                    setGoogleConfigVisible();
                }
                renderStatus();
            });
        });
        if (googleKeyInput) {
            addListener(googleKeyInput, 'input', () => {
                this.tts.setGoogleKey(googleKeyInput.value);
                renderStatus();
            });
        }
        if (googleVoiceSel) {
            addListener(googleVoiceSel, 'change', () => {
                this.tts.setGoogleVoice(googleVoiceSel.value);
            });
        }
        if (googleTestBtn) {
            addListener(googleTestBtn, 'click', () => {
                try { this.tts.cancel(); } catch (e) {}
                this.tts.speak('HALLO! ICH BIN DEINE NEUE STIMME.');
            });
        }

        // ---- TTS-Status live anzeigen ----
        const renderStatus = () => {
            if (!statusEl) return;
            statusEl.classList.remove('ready', 'fallback');
            const backend = this.tts.backend;
            if (backend === 'google') {
                const gs = this.tts.googleStatus;
                if (gs === 'no-key') {
                    statusEl.textContent = '○ Kein API-Key hinterlegt – Fallback aktiv';
                    statusEl.classList.add('fallback');
                } else if (gs === 'error') {
                    statusEl.textContent = '○ Google-Fehler – Fallback aktiv';
                    statusEl.classList.add('fallback');
                } else {
                    statusEl.textContent = '● Google Chirp 3 HD bereit';
                    statusEl.classList.add('ready');
                }
                return;
            }
            if (backend === 'browser') {
                statusEl.textContent = '● Browser-Stimme aktiv';
                statusEl.classList.add('ready');
                return;
            }
            // Piper
            const s = this.tts.status;
            if (s === 'ready') {
                statusEl.textContent = '● Thorsten bereit';
                statusEl.classList.add('ready');
            } else if (s === 'downloading') {
                statusEl.textContent = `⬇ Modell lädt … ${Math.round((this.tts.progress || 0) * 100)}%`;
            } else if (s === 'fallback') {
                statusEl.textContent = '○ Nicht verfügbar – Browser-Stimme aktiv';
                statusEl.classList.add('fallback');
            } else {
                statusEl.textContent = '○ Initialisiert …';
            }
        };
        renderStatus();
        const statusTimer = setInterval(renderStatus, TIMING.STATUS_POLL_MS);
        cleanups.push(() => clearInterval(statusTimer));

        // ---- Schliessen ----
        addListener(closeBtn, 'click', () => this._closeParentMenu());
        // Klick auf den Overlay-Hintergrund schliesst ebenfalls
        const onOverlayClick = (e) => { if (e.target === overlay) this._closeParentMenu(); };
        addListener(overlay, 'click', onOverlayClick);
        // ESC schliesst (Capture, damit globaler ESC-Handler nicht zusaetzlich feuert)
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopImmediatePropagation();
                this._closeParentMenu();
            }
        };
        document.addEventListener('keydown', onKey, true);
        cleanups.push(() => document.removeEventListener('keydown', onKey, true));

        this._parentMenuTransient = { cleanups };
    }

    _closeParentMenu() {
        if (!this._parentMenuTransient) return;
        const overlay = document.getElementById('letter-parent-overlay');
        if (overlay) overlay.classList.add('hidden');
        this._parentMenuTransient.cleanups.forEach(fn => {
            try { fn(); } catch (e) { console.error('[LetterGame] parent menu cleanup failed', e); }
        });
        this._parentMenuTransient = null;
    }

    closeGame() {
        // Vereinheitlicht ueber GameUI (siehe game-ui.js). Frage wird immer
        // gestellt (auch Level 1) und vorgelesen - identisch zum Zaehlspiel
        // und Breakout.
        GameUI.showQuitConfirm({
            tts: this.speechEnabled ? this.tts : null,
            onQuit: () => this._doClose()
        });
    }

    _doClose() {
        // Ausstehende Timeouts (Next-Challenge, Wrong-Reset, Hint-Hide) stoppen
        this._clearPendingTimeouts();
        // Laufende Sprachausgabe abbrechen (inkl. gepufferter Queue)
        if (this.tts && typeof this.tts.cancel === 'function') this.tts.cancel();
        // Eltern-Menue schliessen falls offen
        this._closeParentMenu();
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
        this.state.currentEntry = null;
        this._letterBag = null;
        this._lastLetter = null;
        this._lastWordIdx = {};
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
