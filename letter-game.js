// === letter-game.js: Buchstabenspiel (nutzt shared.js) ===

// Deutsche Anlauttabelle: Buchstabe -> Emoji + Wort
const ANLAUT_TABLE = {
    'A': { emoji: '🐒', word: 'Affe' },
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
    'N': { emoji: '🦏', word: 'Nashorn' },
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
    'Ä': { emoji: '🌾', word: 'Ähre' },
    'Ö': { emoji: '🛢️', word: 'Öl' },
    'Ü': { emoji: '🎁', word: 'Überraschung' }
};

const ALL_LETTERS = Object.keys(ANLAUT_TABLE);

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
            activeLetters: [...ALL_LETTERS], // Eltern-Presets koennen das aendern
            showVirtualKeyboard: false, // Kind soll physische Tastatur lernen; im Eltern-Menue umschaltbar
        };
        this.soundEnabled = true;
        this.speechEnabled = true;
        this.tts = PiperTTSManager.getShared();
        this.music = new MusicManager(SHARED_MUSIC_TRACKS, SHARED_MUSIC_COVERS);
        this.puzzle = new PuzzleManager();
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
        // Fullscreen
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }
        } catch(e) {}
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
            { id: 'letter-sound-toggle', fn: () => this._toggleSound() },
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
                     'letter-sound-toggle', 'letter-prev-track', 'letter-next-track', 'letter-hint-btn'];
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
        // Display aktualisieren
        const display = document.getElementById('letter-display');
        display.innerHTML = `
            <div class="letter-emoji">${entry.emoji}</div>
            <div class="letter-word">${entry.word}</div>
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
            // Key markieren
            const key = document.querySelector(`.letter-key[data-letter="${letter}"]`);
            if (key) key.classList.add('correct');
            // Sound & TTS
            if (this.soundEnabled) SharedAudio.playSuccessMelody();
            if (this.speechEnabled) {
                await this.tts.speak(_pickTTS('correct', { letter, word: ANLAUT_TABLE[letter].word }));
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
            if (this.speechEnabled) {
                await this.tts.speak(_pickTTS('wrong', {}));
            }
            this._setTimeout(() => {
                slot.classList.remove('wrong', 'filled');
                slot.textContent = '';
                document.body.classList.remove('flash-wrong');
                if (key) key.classList.remove('wrong');
                // Nach 3 Fehlversuchen: Hinweis
                if (this.state.wrongStreak >= 3) {
                    this.state.wrongStreak = 0;
                    this._showHint();
                }
                this.state.isProcessing = false;
            }, 800);
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

    _toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.speechEnabled = !this.speechEnabled;
        const btn = document.getElementById('letter-sound-toggle');
        if (btn) {
            btn.textContent = this.soundEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
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

    _showParentMenu() {
        const overlay = document.createElement('div');
        overlay.id = 'letter-parent-menu-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:24px;padding:32px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.2);max-width:400px;width:90vw;max-height:80vh;overflow-y:auto;';

        // Buchstaben-Presets
        const presets = {
            'Alle': ALL_LETTERS,
            'Einfach (A-M)': ALL_LETTERS.slice(0, 13),
            'Vokale': ['A', 'E', 'I', 'O', 'U'],
            'Umlaute': ['Ä', 'Ö', 'Ü'],
            'Erste 10': ALL_LETTERS.slice(0, 10),
        };
        let selectedLetters = [...this.state.activeLetters];
        let newShowVirtualKeyboard = this.state.showVirtualKeyboard;

        let presetHTML = Object.entries(presets).map(([name, letters]) => {
            const active = JSON.stringify(letters) === JSON.stringify(selectedLetters) ? ' style="background:#FFD166;color:#fff;"' : '';
            return `<button class="preset-btn" data-preset="${name}"${active}>${name}</button>`;
        }).join('');

        let letterCheckboxes = ALL_LETTERS.map(l => {
            const checked = selectedLetters.includes(l) ? 'checked' : '';
            return `<label style="display:inline-flex;align-items:center;gap:2px;margin:3px;font-weight:700;font-size:1.1rem;cursor:pointer;">
                <input type="checkbox" data-letter-check="${l}" ${checked} style="width:18px;height:18px;"> ${l}
            </label>`;
        }).join('');

        dialog.innerHTML = `
            <div style="font-size:1.4rem;font-weight:700;color:#232946;margin-bottom:8px;">\u2699\uFE0F Eltern-Einstellungen</div>
            <div style="font-size:0.9rem;color:#666;margin-bottom:16px;">Lange auf Level-Zahl drücken zum Öffnen</div>
            <div style="margin-bottom:16px;">
                <div style="font-size:1rem;font-weight:700;color:#232946;margin-bottom:8px;">Buchstaben-Presets:</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" id="preset-buttons">
                    ${presetHTML}
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:1rem;font-weight:700;color:#232946;margin-bottom:8px;">Einzelne Buchstaben:</div>
                <div style="display:flex;flex-wrap:wrap;justify-content:center;" id="letter-checkboxes">
                    ${letterCheckboxes}
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:1rem;font-weight:700;color:#232946;margin-bottom:8px;">Level anpassen:</div>
                <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
                    <button id="lp-level-down" style="background:#f0f2f5;border:none;border-radius:12px;width:40px;height:40px;font-size:1.4rem;font-weight:700;cursor:pointer;">\u2212</button>
                    <span id="lp-level-val" style="font-size:1.6rem;font-weight:700;color:#232946;min-width:40px;">${this.state.level}</span>
                    <button id="lp-level-up" style="background:#f0f2f5;border:none;border-radius:12px;width:40px;height:40px;font-size:1.4rem;font-weight:700;cursor:pointer;">+</button>
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:1rem;color:#232946;cursor:pointer;">
                    <input type="checkbox" id="lp-vkb" ${newShowVirtualKeyboard ? 'checked' : ''} style="width:20px;height:20px;"> Virtuelle Tastatur anzeigen
                </label>
            </div>
            <div style="margin-bottom:16px;">
                <label style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:1rem;color:#232946;cursor:pointer;">
                    <input type="checkbox" id="lp-piper" ${this.tts.enabled ? 'checked' : ''} style="width:20px;height:20px;"> Piper-Stimme (Thorsten)
                </label>
                <div id="lp-piper-status" style="font-size:0.85rem;color:#666;margin-top:4px;"></div>
            </div>
            <div style="display:flex;gap:12px;justify-content:center;">
                <button id="lp-apply" style="background:#6AD1E3;color:#fff;border:none;border-radius:14px;padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;">Übernehmen</button>
                <button id="lp-close" style="background:#f0f2f5;color:#232946;border:none;border-radius:14px;padding:12px 24px;font-size:1rem;font-weight:700;cursor:pointer;">Abbrechen</button>
            </div>
        `;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Style preset buttons
        overlay.querySelectorAll('.preset-btn').forEach(btn => {
            btn.style.cssText = 'background:#f0f2f5;border:none;border-radius:10px;padding:8px 14px;font-size:0.9rem;font-weight:700;cursor:pointer;transition:background 0.18s;';
        });

        let newLevel = this.state.level;

        // Preset-Buttons
        overlay.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = presets[btn.dataset.preset];
                if (preset) {
                    selectedLetters = [...preset];
                    overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
                        cb.checked = selectedLetters.includes(cb.dataset.letterCheck);
                    });
                    overlay.querySelectorAll('.preset-btn').forEach(b => {
                        b.style.background = '#f0f2f5';
                        b.style.color = '#232946';
                    });
                    btn.style.background = '#FFD166';
                    btn.style.color = '#fff';
                }
            });
        });

        // Checkboxen
        overlay.querySelectorAll('[data-letter-check]').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    if (!selectedLetters.includes(cb.dataset.letterCheck)) {
                        selectedLetters.push(cb.dataset.letterCheck);
                        selectedLetters.sort((a, b) => a.localeCompare(b, 'de'));
                    }
                } else {
                    selectedLetters = selectedLetters.filter(l => l !== cb.dataset.letterCheck);
                }
            });
        });

        // Level
        const levelVal = document.getElementById('lp-level-val');
        document.getElementById('lp-level-down').addEventListener('click', () => {
            if (newLevel > 1) { newLevel--; levelVal.textContent = newLevel; }
        });
        document.getElementById('lp-level-up').addEventListener('click', () => {
            newLevel++; levelVal.textContent = newLevel;
        });

        const statusEl = document.getElementById('lp-piper-status');
        const renderStatus = () => {
            if (!statusEl) return;
            const s = this.tts.status;
            if (s === 'ready') statusEl.textContent = 'Bereit';
            else if (s === 'downloading') statusEl.textContent = `Modell lädt … ${Math.round((this.tts.progress || 0) * 100)}%`;
            else if (s === 'fallback') statusEl.textContent = 'Nicht verfügbar – Browser-Stimme aktiv';
            else statusEl.textContent = 'Initialisiert …';
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
        const keyHandler = (e) => {
            if (e.key === 'Escape') cleanup();
        };
        document.addEventListener('keydown', keyHandler);

        const vkbCheckbox = document.getElementById('lp-vkb');
        vkbCheckbox.addEventListener('change', () => {
            newShowVirtualKeyboard = vkbCheckbox.checked;
        });

        let newPiperEnabled = this.tts.enabled;
        const piperCheckbox = document.getElementById('lp-piper');
        piperCheckbox.addEventListener('change', () => {
            newPiperEnabled = piperCheckbox.checked;
        });

        document.getElementById('lp-apply').addEventListener('click', () => {
            if (selectedLetters.length < 2) {
                selectedLetters = [...ALL_LETTERS];
            }
            this.state.activeLetters = selectedLetters;
            this.state.level = newLevel;
            this.state.showVirtualKeyboard = newShowVirtualKeyboard;
            this.tts.setEnabled(newPiperEnabled);
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
        // Fullscreen beenden
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
        } catch(e) {}
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
