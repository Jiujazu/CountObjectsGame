// Renders emojis as <img> elements pointing at bundled Fluent UI Emoji PNGs
// in images/emojis/, with a graceful fallback to the native Unicode glyph
// when a matching file is missing.
//
// Exposes two globals used by script.js and letter-game.js:
//   - emojiToCodepoint(glyph)          -> "1f34e" / "1f3f4-200d-2620"
//   - emojiImg(glyph, alt, className)  -> HTMLImageElement | HTMLSpanElement

(function (global) {
  'use strict';

  var EMOJI_DIR = 'images/emojis/';

  // Escape hatch for emoji entries that should load a specific local asset
  // instead of the auto-derived codepoint path. Format: "custom:<filename>".
  // Example: { emoji: 'custom:xylophon.svg', word: 'Xylophon' }
  var CUSTOM_PREFIX = 'custom:';

  function emojiToCodepoint(glyph) {
    var parts = [];
    for (var i = 0; i < glyph.length; ) {
      var cp = glyph.codePointAt(i);
      // Skip variation selector 16 (0xFE0F). Fluent's file names don't use it.
      if (cp !== 0xfe0f) parts.push(cp.toString(16));
      i += cp > 0xffff ? 2 : 1;
    }
    return parts.join('-');
  }

  function emojiAssetPath(glyph) {
    if (typeof glyph === 'string' && glyph.indexOf(CUSTOM_PREFIX) === 0) {
      return EMOJI_DIR + glyph.slice(CUSTOM_PREFIX.length);
    }
    return EMOJI_DIR + emojiToCodepoint(glyph) + '.png';
  }

  function emojiImg(glyph, alt, className) {
    var img = document.createElement('img');
    img.src = emojiAssetPath(glyph);
    img.alt = alt || '';
    if (className) img.className = className;
    img.decoding = 'async';
    img.draggable = false;
    img.setAttribute('aria-hidden', alt ? 'false' : 'true');
    img.addEventListener('error', function onError() {
      // Swap in a <span> with the native emoji so kids still see *something*.
      var span = document.createElement('span');
      span.textContent = glyph && glyph.indexOf(CUSTOM_PREFIX) === 0 ? '' : glyph;
      if (className) span.className = className + ' emoji-fallback';
      img.replaceWith(span);
    });
    return img;
  }

  global.emojiToCodepoint = emojiToCodepoint;
  global.emojiAssetPath = emojiAssetPath;
  global.emojiImg = emojiImg;
})(window);
