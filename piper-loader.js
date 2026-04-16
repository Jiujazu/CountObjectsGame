// piper-loader.js: laedt die lokale Piper-TTS-Bibliothek als ES-Modul
// und stellt sie unter window._piper bereit, damit der (Nicht-Modul-)
// Code in shared.js / letter-game.js darauf zugreifen kann.
import * as piper from './vendor/piper/piper-tts-web.js';
window._piper = piper;
window.dispatchEvent(new CustomEvent('piper-ready'));
