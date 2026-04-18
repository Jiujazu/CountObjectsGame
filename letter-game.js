// === letter-game.js: Buchstabenspiel (nutzt shared.js) ===

// Deutsche Anlauttabelle: Buchstabe -> Liste aus { emoji, word }.
// Mehrere Worte pro Buchstabe sorgen fuer Abwechslung. Beim Spielen wird zufaellig
// einer der Eintraege gewaehlt. Bilder werden via OpenMoji (CDN) gerendert; bei
// Ladefehler faellt das UI auf das native Emoji-Glyph zurueck.
const ANLAUT_TABLE = {
    'A': [
        { emoji: '🐒', word: 'Affe' },
        { emoji: '🍎', word: 'Apfel' },
        { emoji: '🐜', word: 'Ameise' },
        { emoji: '🍍', word: 'Ananas' },
        { emoji: '🚗', word: 'Auto' },
        { emoji: '🦅', word: 'Adler' },
        { emoji: '⚓', word: 'Anker' },
        { emoji: '👁️', word: 'Auge' },
        { emoji: '🪗', word: 'Akkordeon' },
    ],
    'B': [
        { emoji: '🐻', word: 'Bär' },
        { emoji: '🍌', word: 'Banane' },
        { emoji: '⚽', word: 'Ball' },
        { emoji: '📖', word: 'Buch' },
        { emoji: '🌳', word: 'Baum' },
        { emoji: '🌸', word: 'Blume' },
        { emoji: '🍞', word: 'Brot' },
        { emoji: '🐝', word: 'Biene' },
        { emoji: '🏰', word: 'Burg' },
        { emoji: '🚌', word: 'Bus' },
    ],
    'C': [
        { emoji: '🤡', word: 'Clown' },
        { emoji: '💻', word: 'Computer' },
        { emoji: '🛋️', word: 'Couch' },
        { emoji: '🤠', word: 'Cowboy' },
    ],
    'D': [
        { emoji: '🐬', word: 'Delfin' },
        { emoji: '🐉', word: 'Drache' },
        { emoji: '🍩', word: 'Donut' },
        { emoji: '🦖', word: 'Dinosaurier' },
        { emoji: '🚿', word: 'Dusche' },
        { emoji: '👍', word: 'Daumen' },
        { emoji: '🎲', word: 'Würfel' },
    ],
    'E': [
        { emoji: '🐘', word: 'Elefant' },
        { emoji: '🦆', word: 'Ente' },
        { emoji: '🍦', word: 'Eis' },
        { emoji: '🍓', word: 'Erdbeere' },
        { emoji: '🥚', word: 'Ei' },
        { emoji: '🦉', word: 'Eule' },
        { emoji: '🐿️', word: 'Eichhörnchen' },
    ],
    'F': [
        { emoji: '🐟', word: 'Fisch' },
        { emoji: '🐸', word: 'Frosch' },
        { emoji: '🦊', word: 'Fuchs' },
        { emoji: '🔥', word: 'Feuer' },
        { emoji: '✈️', word: 'Flugzeug' },
        { emoji: '🚲', word: 'Fahrrad' },
        { emoji: '🍼', word: 'Flasche' },
        { emoji: '🪶', word: 'Feder' },
        { emoji: '🦶', word: 'Fuß' },
    ],
    'G': [
        { emoji: '🦒', word: 'Giraffe' },
        { emoji: '🎸', word: 'Gitarre' },
        { emoji: '👻', word: 'Gespenst' },
        { emoji: '🎁', word: 'Geschenk' },
        { emoji: '🍴', word: 'Gabel' },
        { emoji: '🔔', word: 'Glocke' },
        { emoji: '🦍', word: 'Gorilla' },
        { emoji: '🐐', word: 'Geiß' },
    ],
    'H': [
        { emoji: '🐶', word: 'Hund' },
        { emoji: '🐰', word: 'Hase' },
        { emoji: '🏠', word: 'Haus' },
        { emoji: '🐓', word: 'Hahn' },
        { emoji: '🎩', word: 'Hut' },
        { emoji: '❤️', word: 'Herz' },
        { emoji: '✋', word: 'Hand' },
        { emoji: '🦈', word: 'Hai' },
        { emoji: '🍯', word: 'Honig' },
        { emoji: '⛑️', word: 'Helm' },
    ],
    'I': [
        { emoji: '🦔', word: 'Igel' },
        { emoji: '🏝️', word: 'Insel' },
        { emoji: '🛖', word: 'Iglu' },
        { emoji: '🐛', word: 'Insekt' },
    ],
    'J': [
        { emoji: '🪀', word: 'Jojo' },
        { emoji: '👦', word: 'Junge' },
        { emoji: '🧥', word: 'Jacke' },
        { emoji: '🥛', word: 'Joghurt' },
        { emoji: '🏹', word: 'Jäger' },
    ],
    'K': [
        { emoji: '🐱', word: 'Katze' },
        { emoji: '🐊', word: 'Krokodil' },
        { emoji: '👑', word: 'Krone' },
        { emoji: '🐄', word: 'Kuh' },
        { emoji: '🧀', word: 'Käse' },
        { emoji: '🎂', word: 'Kuchen' },
        { emoji: '🐨', word: 'Koala' },
        { emoji: '🕯️', word: 'Kerze' },
        { emoji: '📷', word: 'Kamera' },
        { emoji: '🌵', word: 'Kaktus' },
    ],
    'L': [
        { emoji: '🦁', word: 'Löwe' },
        { emoji: '💡', word: 'Lampe' },
        { emoji: '🚛', word: 'Laster' },
        { emoji: '🍭', word: 'Lutscher' },
        { emoji: '🪜', word: 'Leiter' },
        { emoji: '🚂', word: 'Lokomotive' },
        { emoji: '🍋', word: 'Limone' },
    ],
    'M': [
        { emoji: '🐭', word: 'Maus' },
        { emoji: '🌙', word: 'Mond' },
        { emoji: '🐞', word: 'Marienkäfer' },
        { emoji: '👩', word: 'Mama' },
        { emoji: '🌽', word: 'Mais' },
        { emoji: '🍉', word: 'Melone' },
        { emoji: '🥛', word: 'Milch' },
        { emoji: '🧲', word: 'Magnet' },
        { emoji: '🦟', word: 'Mücke' },
    ],
    'N': [
        { emoji: '🦏', word: 'Nashorn' },
        { emoji: '👃', word: 'Nase' },
        { emoji: '🪺', word: 'Nest' },
        { emoji: '🪡', word: 'Nadel' },
        { emoji: '🥜', word: 'Nuss' },
        { emoji: '🌃', word: 'Nacht' },
    ],
    'O': [
        { emoji: '🦦', word: 'Otter' },
        { emoji: '👵', word: 'Oma' },
        { emoji: '👴', word: 'Opa' },
        { emoji: '🍊', word: 'Orange' },
        { emoji: '🐂', word: 'Ochse' },
        { emoji: '👂', word: 'Ohr' },
        { emoji: '🐙', word: 'Oktopus' },
    ],
    'P': [
        { emoji: '🐧', word: 'Pinguin' },
        { emoji: '🐴', word: 'Pferd' },
        { emoji: '🍕', word: 'Pizza' },
        { emoji: '🦜', word: 'Papagei' },
        { emoji: '🚓', word: 'Polizei' },
        { emoji: '🍄', word: 'Pilz' },
        { emoji: '🪆', word: 'Puppe' },
        { emoji: '📦', word: 'Paket' },
        { emoji: '🌴', word: 'Palme' },
    ],
    'Q': [
        { emoji: '🪼', word: 'Qualle' },
        { emoji: '🟦', word: 'Quadrat' },
    ],
    'R': [
        { emoji: '🚀', word: 'Rakete' },
        { emoji: '🤖', word: 'Roboter' },
        { emoji: '🌧️', word: 'Regen' },
        { emoji: '🌈', word: 'Regenbogen' },
        { emoji: '💍', word: 'Ring' },
        { emoji: '🌹', word: 'Rose' },
        { emoji: '🐀', word: 'Ratte' },
    ],
    'S': [
        { emoji: '☀️', word: 'Sonne' },
        { emoji: '⭐', word: 'Stern' },
        { emoji: '🐑', word: 'Schaf' },
        { emoji: '🦋', word: 'Schmetterling' },
        { emoji: '🐍', word: 'Schlange' },
        { emoji: '🚢', word: 'Schiff' },
        { emoji: '🏫', word: 'Schule' },
        { emoji: '🐌', word: 'Schnecke' },
        { emoji: '👟', word: 'Schuh' },
        { emoji: '⛄', word: 'Schneemann' },
    ],
    'T': [
        { emoji: '🐯', word: 'Tiger' },
        { emoji: '🍅', word: 'Tomate' },
        { emoji: '☕', word: 'Tasse' },
        { emoji: '📞', word: 'Telefon' },
        { emoji: '🚜', word: 'Traktor' },
        { emoji: '🎒', word: 'Tasche' },
        { emoji: '🎄', word: 'Tannenbaum' },
        { emoji: '🎺', word: 'Trompete' },
    ],
    'U': [
        { emoji: '🦉', word: 'Uhu' },
        { emoji: '⌚', word: 'Uhr' },
        { emoji: '🛸', word: 'Ufo' },
        { emoji: '🚇', word: 'U-Bahn' },
    ],
    'V': [
        { emoji: '🐦', word: 'Vogel' },
        { emoji: '🌋', word: 'Vulkan' },
        { emoji: '🧛', word: 'Vampir' },
    ],
    'W': [
        { emoji: '🐋', word: 'Wal' },
        { emoji: '🐺', word: 'Wolf' },
        { emoji: '☁️', word: 'Wolke' },
        { emoji: '🍉', word: 'Wassermelone' },
        { emoji: '🌭', word: 'Wurst' },
        { emoji: '🪱', word: 'Wurm' },
    ],
    'X': [
        { emoji: '🎸', word: 'Xylophon' },
    ],
    'Y': [
        { emoji: '🧘', word: 'Yoga' },
        { emoji: '🛥️', word: 'Yacht' },
    ],
    'Z': [
        { emoji: '🦓', word: 'Zebra' },
        { emoji: '🦷', word: 'Zahn' },
        { emoji: '🧙', word: 'Zauberer' },
        { emoji: '🍋', word: 'Zitrone' },
        { emoji: '🚂', word: 'Zug' },
        { emoji: '⛺', word: 'Zelt' },
        { emoji: '🐐', word: 'Ziege' },
    ],
    'Ä': [
        { emoji: '🌾', word: 'Ähre' },
        { emoji: '🍏', word: 'Äpfel' },
    ],
    'Ö': [
        { emoji: '🛢️', word: 'Öl' },
        { emoji: '🔥', word: 'Ofen' },
    ],
    'Ü': [
        { emoji: '🎁', word: 'Überraschung' },
        { emoji: '🌉', word: 'Übergang' },
    ],
};

const ALL_LETTERS = Object.keys(ANLAUT_TABLE);

// OpenMoji-CDN. Datei-Namen entsprechen Unicode-Codepoints (hex, mit "-" verbunden,
// Variation Selector U+FE0F wird weggelassen). z.B. 🐒 -> 1F412.svg, ☀️ -> 2600.svg.
const OPENMOJI_BASE = 'https://cdn.jsdelivr.net/npm/openmoji@15.1.0/color/svg/';

function _emojiToOpenMojiCode(emoji) {
    const codes = [];
    for (const ch of emoji) {
        const cp = ch.codePointAt(0);
        if (cp === 0xFE0F) continue; // Emoji-Variation-Selector ueberspringen
        codes.push(cp.toString(16).toUpperCase());
    }
    return codes.join('-');
}

function _renderEmojiHTML(emoji, alt) {
    const code = _emojiToOpenMojiCode(emoji);
    const url = `${OPENMOJI_BASE}${code}.svg`;
    const safeAlt = String(alt || emoji).replace(/"/g, '&quot;');
    const safeEmoji = String(emoji).replace(/"/g, '&quot;');
    // onerror: Bei Ladefehler das native Emoji-Zeichen anzeigen.
    return `<img class="openmoji" src="${url}" alt="${safeAlt}" `
         + `onerror="this.outerHTML='<span class=&quot;openmoji-fallback&quot;>${safeEmoji}</span>'">`;
}

// Lautier-Mapping (Silbenmethode): Buchstabe -> Text, den TTS als Laut spricht.
// Vokale klingen ohnehin wie ihr Laut. Plosive (B/D/G/K/P/T) brauchen einen
// Kurzvokal-Anker, sonst nicht isoliert sprechbar. Dauerlaute werden verlaengert.
const LAUTIERT_MAP = {
    'A': 'A',
    'B': 'Buh',
    'C': 'Kuh',   // C wie in Clown = [k]
    'D': 'Duh',
    'E': 'E',
    'F': 'Fff',
    'G': 'Guh',
    'H': 'Ha',
    'I': 'I',
    'J': 'Ja',    // J wie in Jojo = [j]
    'K': 'Kuh',
    'L': 'Lll',
    'M': 'Mmm',
    'N': 'Nnn',
    'O': 'O',
    'P': 'Puh',
    'Q': 'Ku',    // Qu wie in Qualle = [kv], meist einfach [k]
    'R': 'Rrr',
    'S': 'Sss',
    'T': 'Tuh',
    'U': 'U',
    'V': 'Fff',   // V wie in Vogel = [f]
    'W': 'Www',   // W = [v]
    'X': 'Iks',
    'Y': 'Ja',    // Y wie in Yoga = [j]
    'Z': 'Tsss',  // Z = [ts]
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
            currentEntry: null, // gewaehlter { emoji, word }-Eintrag fuer den aktuellen Buchstaben
            wrongStreak: 0,
            isProcessing: false,
            activeLetters: [...ALL_LETTERS], // Eltern-Presets koennen das aendern
            showVirtualKeyboard: false, // Kind soll physische Tastatur lernen; im Eltern-Menue umschaltbar
            showWord: false, // Wort als Spoiler ausblenden; wird bei richtiger Antwort eingeblendet
            lautierEnabled: localStorage.getItem('letter-lautiert') === 'true', // Silbenmethode: TTS spricht Laut statt Buchstabenname
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
                     'letter-prev-track', 'letter-next-track', 'letter-hint-btn'];
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
        // Aus den verfuegbaren Worten zu diesem Buchstaben einen zufaellig waehlen.
        const entries = ANLAUT_TABLE[this.state.currentLetter];
        const entry = entries[Math.floor(Math.random() * entries.length)];
        this.state.currentEntry = entry;
        // Display aktualisieren. Wort wird zunaechst versteckt, damit der Anfangsbuchstabe nicht verraten wird.
        const display = document.getElementById('letter-display');
        const wordClass = this.state.showWord ? 'letter-word' : 'letter-word hidden';
        display.innerHTML = `
            <div class="letter-emoji">${_renderEmojiHTML(entry.emoji, entry.word)}</div>
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
        const entry = this.state.currentEntry;
        if (!entry) return;
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
                const word = (this.state.currentEntry && this.state.currentEntry.word) || letter;
                await this.tts.speak(_pickTTS('correct', { letter: this._letterForSpeech(letter), word }));
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
        const entry = this.state.currentEntry;
        // Bei Hinweis immer das Wort zeigen (haeufige Fehlversuche → volle Unterstuetzung)
        const wordEl = document.querySelector('.letter-word');
        if (wordEl) wordEl.classList.remove('hidden');
        // TTS Hinweis nur wenn Sprache aktiviert
        if (this.speechEnabled && entry) {
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

        const presets = {
            'Alle': ALL_LETTERS,
            'Einfach (A-M)': ALL_LETTERS.slice(0, 13),
            'Vokale': ['A', 'E', 'I', 'O', 'U'],
            'Umlaute': ['Ä', 'Ö', 'Ü'],
            'Erste 10': ALL_LETTERS.slice(0, 10),
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
            if (selectedLetters.length < 2) selectedLetters = [...ALL_LETTERS];
            this.state.activeLetters = selectedLetters;
            this.state.level = newLevel;
            this.state.showVirtualKeyboard = newShowVirtualKeyboard;
            this.state.showWord = newShowWord;
            this.state.lautierEnabled = newLautierEnabled;
            localStorage.setItem('letter-lautiert', newLautierEnabled ? 'true' : 'false');
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
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:24px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:320px;';
        dialog.innerHTML = `
            <div style="font-size:2.5rem;margin-bottom:16px;">\uD83D\uDED1</div>
            <div style="font-size:1.2rem;font-weight:700;color:#232946;margin-bottom:24px;">Spiel wirklich beenden?</div>
            <div style="display:flex;gap:16px;justify-content:center;">
                <button id="letter-close-yes" style="background:#FF6F91;color:#fff;border:none;border-radius:14px;padding:12px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;">Ja</button>
                <button id="letter-close-no" style="background:#6AD1E3;color:#fff;border:none;border-radius:14px;padding:12px 28px;font-size:1.1rem;font-weight:700;cursor:pointer;">Nein</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
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
