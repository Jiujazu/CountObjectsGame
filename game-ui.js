// === game-ui.js: Einheitliche UI-Komponenten fuer alle Spiele ===
//
// Single source of truth fuer geteilte Dialoge (Quit-Confirm, spaeter Pause/
// Parent-Menue). Die Spiele rufen diese API auf statt eigene HTML/CSS/JS-
// Duplikate zu pflegen. Visuelle Regeln:
//   - Grosse, beschriftete Emoji-Buttons statt ✔/✕ (mehrdeutig fuer Kinder).
//   - Frage wird immer gestellt (auch Level 1) - ein versehentliches X darf
//     keinen Fortschritt kosten.
//   - Optional per TTS vorgelesen, damit Nicht-Leser entscheiden koennen.
(function (global) {
    'use strict';

    const OVERLAY_ID = 'gameui-quit-overlay';
    const WIN_OVERLAY_ID = 'gameui-win-overlay';
    const ENCOURAGE_LINES = [
        'Fast! Versuch\'s nochmal.',
        'Nicht ganz - du schaffst das!',
        'Probier\'s nochmal, du kannst das!',
        'Oh, nochmal versuchen!',
        'Weiter so, nochmal!',
        'Das war knapp! Nochmal.'
    ];

    function cancelTTS(tts) {
        if (tts && typeof tts.cancel === 'function') {
            try { tts.cancel(); } catch (_) {}
        }
    }

    function speakQuestion(tts) {
        if (!tts || typeof tts.speak !== 'function') return;
        try { tts.speak('M\u00f6chtest du weiterspielen oder aufh\u00f6ren?'); } catch (_) {}
    }

    const GameUI = {
        // Zeigt den einheitlichen Quit-Dialog. Gibt `true` zurueck, wenn der
        // Dialog geoeffnet wurde, `false` falls bereits einer sichtbar ist
        // (Doppelklicks/ESC-Doppelfeuer werden so abgefangen).
        showQuitConfirm(options) {
            options = options || {};
            if (document.getElementById(OVERLAY_ID)) return false;

            const overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            overlay.className = 'close-confirm-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'Weiterspielen oder aufh\u00f6ren?');

            const dialog = document.createElement('div');
            dialog.className = 'close-confirm-dialog';
            dialog.innerHTML = [
                '<div class="close-confirm-emoji" aria-hidden="true">\uD83E\uDD14</div>',
                '<div class="close-confirm-text">Weiterspielen oder aufh\u00f6ren?</div>',
                '<div class="close-confirm-actions">',
                '    <button type="button" class="close-confirm-btn continue" data-gameui-action="cancel" title="Weiterspielen" aria-label="Weiterspielen">\u25B6\uFE0F</button>',
                '    <button type="button" class="close-confirm-btn stop" data-gameui-action="quit" title="Aufh\u00f6ren" aria-label="Aufh\u00f6ren">\uD83D\uDED1</button>',
                '</div>'
            ].join('');
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            speakQuestion(options.tts);

            let closed = false;
            const finish = (action) => {
                if (closed) return;
                closed = true;
                cancelTTS(options.tts);
                overlay.remove();
                document.removeEventListener('keydown', onKey, true);
                const cb = action === 'quit' ? options.onQuit : options.onCancel;
                if (typeof cb === 'function') {
                    try { cb(); } catch (e) { console.error('[GameUI] quit callback failed', e); }
                }
            };

            const onKey = (e) => {
                if (e.key === 'Escape') {
                    // Capture-Phase + stopImmediatePropagation: verhindert, dass der
                    // globale ESC-Handler des Spiels parallel einen neuen Dialog oeffnet.
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    finish('cancel');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    finish('quit');
                }
            };
            document.addEventListener('keydown', onKey, true);

            dialog.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-gameui-action]');
                if (!btn) return;
                e.stopPropagation();
                finish(btn.dataset.gameuiAction);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) finish('cancel');
            });

            return true;
        },

        // Hilfsmethode fuer Spiele, die wissen muessen ob aktuell ein
        // Quit-Dialog laeuft (z.B. um Pause-Menue-Input zu blockieren).
        isQuitConfirmOpen() {
            return !!document.getElementById(OVERLAY_ID);
        },

        // Einheitliches Fehler-Feedback fuer Zaehlen/Buchstaben:
        // kurzes Schuetteln + rote Markierung + dezenter Ton + ermunternde Stimme.
        // `element` wird per CSS-Klasse animiert. `audio` (SharedAudio) spielt
        // einen sanften Fehlerton, `tts` spricht eine ermunternde Zeile.
        shakeError(element, options) {
            options = options || {};
            if (element && element.classList) {
                element.classList.remove('error-shake');
                // force reflow so Re-Add triggers animation
                void element.offsetWidth;
                element.classList.add('error-shake');
                setTimeout(() => {
                    if (element && element.classList) element.classList.remove('error-shake');
                }, 600);
            }
            if (options.audio && typeof options.audio.playError === 'function') {
                try { options.audio.playError(); } catch (_) {}
            } else if (options.audio && typeof options.audio.playTone === 'function') {
                try { options.audio.playTone(220, 0.18, 'sine', 0.15); } catch (_) {}
            }
            if (options.tts && typeof options.tts.speak === 'function') {
                const line = options.message ||
                    ENCOURAGE_LINES[Math.floor(Math.random() * ENCOURAGE_LINES.length)];
                try { options.tts.speak(line); } catch (_) {}
            }
        },

        // Einheitliches Win-Overlay am Level-Ende. Klein, freundlich,
        // kein Game-Over. Schliesst nach `duration` ms und ruft `onNext` auf.
        showWinOverlay(options) {
            options = options || {};
            const existing = document.getElementById(WIN_OVERLAY_ID);
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = WIN_OVERLAY_ID;
            overlay.className = 'gameui-win-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const dialog = document.createElement('div');
            dialog.className = 'gameui-win-dialog';
            const level = options.level;
            const title = options.title || (level ? 'LEVEL ' + level + ' GESCHAFFT!' : 'SUPER!');
            dialog.innerHTML = [
                '<div class="gameui-win-emoji" aria-hidden="true">\uD83C\uDF89</div>',
                '<div class="gameui-win-text">' + title + '</div>',
                '<button type="button" class="gameui-win-next" aria-label="Weiter">\u27A1\uFE0F</button>'
            ].join('');
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            if (options.tts && typeof options.tts.speak === 'function') {
                try { options.tts.speak(options.speech || title); } catch (_) {}
            }

            let closed = false;
            const finish = () => {
                if (closed) return;
                closed = true;
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                document.removeEventListener('keydown', onKey, true);
                if (typeof options.onNext === 'function') {
                    try { options.onNext(); } catch (e) { console.error('[GameUI] win onNext failed', e); }
                }
            };

            const onKey = (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    finish();
                }
            };
            document.addEventListener('keydown', onKey, true);
            dialog.querySelector('.gameui-win-next').addEventListener('click', (e) => {
                e.stopPropagation();
                finish();
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) finish();
            });

            const duration = typeof options.duration === 'number' ? options.duration : 2600;
            if (duration > 0) setTimeout(finish, duration);
        }
    };

    global.GameUI = GameUI;
})(typeof window !== 'undefined' ? window : globalThis);
