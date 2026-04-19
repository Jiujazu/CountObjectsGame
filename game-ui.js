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
    const SUCCESS_SCREEN_ID = 'gameui-success-screen';
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

        // Einheitlicher gruener Success-Screen fuer Zaehlen/Buchstaben:
        // grossflaechige, positive Bestaetigung der richtigen Antwort
        // (z.B. Zahl oder Buchstabe). Auto-Dismiss, ueberspringbar per
        // Klick/Taste, ruft `onNext` auf.
        showSuccessScreen(options) {
            options = options || {};
            const existing = document.getElementById(SUCCESS_SCREEN_ID);
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = SUCCESS_SCREEN_ID;
            overlay.className = 'success-screen';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            const content = document.createElement('div');
            content.className = 'success-number';
            content.textContent = options.content != null ? String(options.content) : '';
            overlay.appendChild(content);

            document.body.appendChild(overlay);
            // Reflow erzwingen, damit die CSS-Transition von opacity 0 -> 1 greift.
            void overlay.offsetWidth;
            overlay.classList.add('show');

            let closed = false;
            const finish = () => {
                if (closed) return;
                closed = true;
                cancelTTS(options.tts);
                document.removeEventListener('keydown', onKey, true);
                document.removeEventListener('click', onClick, true);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (typeof options.onNext === 'function') {
                    try { options.onNext(); } catch (e) { console.error('[GameUI] success onNext failed', e); }
                }
            };

            const onKey = (e) => {
                if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    finish();
                }
            };
            const onClick = (e) => {
                // Capture + stopImmediatePropagation: Klick waehrend der Overlay
                // offen ist soll NUR den Overlay schliessen, nicht zusaetzlich
                // auf Buttons darunter feuern.
                e.preventDefault();
                e.stopImmediatePropagation();
                finish();
            };

            document.addEventListener('keydown', onKey, true);
            document.addEventListener('click', onClick, true);

            const duration = typeof options.duration === 'number' ? options.duration : 3000;
            if (duration > 0) setTimeout(finish, duration);

            return { close: finish };
        }
    };

    global.GameUI = GameUI;
})(typeof window !== 'undefined' ? window : globalThis);
