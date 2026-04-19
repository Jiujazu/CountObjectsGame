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
        }
    };

    global.GameUI = GameUI;
})(typeof window !== 'undefined' ? window : globalThis);
