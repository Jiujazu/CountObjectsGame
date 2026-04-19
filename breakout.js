(() => {
// ═══════════════════════════════════════════════════════════════
// ULTIMATE BREAKOUT - The craziest breakout game ever made
// ═══════════════════════════════════════════════════════════════

const W = 480, H = 600;
const BRICK_ROWS = 7, BRICK_COLS = 8;
const BRICK_W = 52, BRICK_H = 18, BRICK_PAD = 4;
const BRICK_OFFSET_X = (W - (BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD)) / 2;
const BRICK_OFFSET_Y = 50;
const ROW_COLORS = ['#ff4466','#ff6644','#ff8844','#ffcc44','#44ff88','#44bbff','#aa66ff'];
// Hintergrundmusik nutzt jetzt den Shared MusicManager (SHARED_MUSIC_TRACKS aus shared.js) -
// dieselbe Liste wie „Zaehlen" und „Buchstaben". Kein lokales Tracklist-Array mehr.
const POWERUP_TYPES = ['multiball','laser','giant','tiny','fireball','slowmo','speeddemon','shield','magnet','bomb'];
const POWERUP_COLORS = {
    multiball:'#44ffff', laser:'#ff4444', giant:'#44ff44', tiny:'#ff44ff',
    fireball:'#ff8844', slowmo:'#ffffff', speeddemon:'#ffff44', shield:'#4488ff',
    magnet:'#aa44ff', bomb:'#cc2200'
};
const POWERUP_SYMBOLS = {
    multiball:'M', laser:'L', giant:'G', tiny:'T', fireball:'F',
    slowmo:'S', speeddemon:'D', shield:'H', magnet:'N', bomb:'B'
};
const POWERUP_EMOJI = {
    multiball:'\u26A1', laser:'\u2191', giant:'\u2B1B', tiny:'\u25AA',
    fireball:'\uD83D\uDD25', slowmo:'\u23F3', speeddemon:'\uD83D\uDCA8',
    shield:'\uD83D\uDEE1\uFE0F', magnet:'\uD83E\uDDF2', bomb:'\uD83D\uDCA3'
};
const POWERUP_NAMES_DE = {
    multiball:'MULTIBALL', laser:'LASER', giant:'RIESE', tiny:'WINZIG',
    fireball:'FEUERBALL', slowmo:'ZEITLUPE', speeddemon:'TURBO',
    shield:'SCHILD', magnet:'MAGNET', bomb:'BOMBE'
};
// HINTS werden auf das Canvas gezeichnet - hier muss der String selbst schon
// in Grossbuchstaben vorliegen (CSS text-transform wirkt nur im DOM).
const POWERUP_HINTS_DE = {
    multiball:'MEHR B\u00c4LLE!', laser:'PADDLE SCHIESST!', giant:'GROSSES PADDLE!', tiny:'KLEINES PADDLE!',
    fireball:'BALL BRENNT!', slowmo:'ALLES LANGSAM!', speeddemon:'ALLES SCHNELL!',
    shield:'BODEN GESCH\u00dcTZT!', magnet:'BALL KLEBT!', bomb:'EXPLOSION!'
};
// Kurze, laut aussprechbare Phrasen fuer 3-4jaehrige (Nichtleser).
const POWERUP_SPEECH_DE = {
    multiball:'Mehr B\u00e4lle!', laser:'Laser an!', giant:'Gro\u00dfes Paddel!', tiny:'Kleines Paddel!',
    fireball:'Feuerball!', slowmo:'Zeitlupe!', speeddemon:'Turbo!',
    shield:'Schild an!', magnet:'Magnet an!', bomb:'Bombe!'
};
const POWERUP_GOOD = {
    multiball:true, laser:true, giant:true, tiny:false,
    fireball:true, slowmo:true, speeddemon:false,
    shield:true, magnet:true, bomb:false
};
const POWERUP_WEIGHTS = {
    multiball:15, laser:10, giant:15, tiny:5, fireball:10,
    slowmo:10, speeddemon:10, shield:15, magnet:5, bomb:5
};
const POWERUP_DURATIONS = {
    laser:480, giant:600, tiny:600, fireball:360, slowmo:300, speeddemon:480, magnet:600
};
const POWERUP_COMBOS = [
    { id:'meteorShower',  requires:['fireball','multiball'], name:'METEOR SHOWER', color:'#ff6622' },
    { id:'megaBeam',      requires:['giant','laser'],        name:'MEGA BEAM',     color:'#44ff44' },
    { id:'inferno',       requires:['fireball','speeddemon'],name:'INFERNO',       color:'#ff2200' },
    { id:'fortress',      requires:['shield','magnet'],      name:'FESTUNG',       color:'#6644ff' },
    { id:'precision',     requires:['slowmo','tiny'],        name:'PRECISION',     color:'#ff88ff' },
];

// ═══════════════════════════════════════════════════════════════
// WORLD THEMES
// ═══════════════════════════════════════════════════════════════
const WORLD_THEMES = [
    { // World 1: Weltraum (default, levels 0-1)
        name: 'WELTRAUM',
        emoji: '🚀',
        bg: '#111133',
        starColor: '#ccccff',
        brickColors: ['#ff4466','#ff6644','#ff8844','#ffcc44','#44ff88','#44bbff','#aa66ff'],
        particleColor: '#8888ff',
        uiAccent: '#44bbff',
        bgGlow: 'rgba(100,100,255,0.15)',
    },
    { // World 2: Unterwasser (levels 2-3)
        name: 'TIEFSEE',
        emoji: '🐠',
        bg: '#0a1a2e',
        starColor: '#44aacc',
        brickColors: ['#22ccaa','#44ddbb','#66eedd','#88ffee','#44aadd','#2288bb','#55ccff'],
        particleColor: '#44ddff',
        uiAccent: '#44ddbb',
        bgGlow: 'rgba(60,180,220,0.12)',
    },
    { // World 3: Vulkan (levels 4-5)
        name: 'VULKAN',
        emoji: '🌋',
        bg: '#1a0a0a',
        starColor: '#ff8844',
        brickColors: ['#ff2200','#ff4400','#ff6600','#ff8800','#ffaa00','#ffcc22','#ffee44'],
        particleColor: '#ff6622',
        uiAccent: '#ff8844',
        bgGlow: 'rgba(255,100,50,0.15)',
    },
    { // World 4: Bonbon-Land (levels 6-7)
        name: 'BONBON',
        emoji: '🍭',
        bg: '#1a0a20',
        starColor: '#ff88cc',
        brickColors: ['#ff66aa','#ff88cc','#ffaadd','#cc88ff','#88ccff','#88ffcc','#ffff88'],
        particleColor: '#ff88dd',
        uiAccent: '#ff88cc',
        bgGlow: 'rgba(255,130,200,0.15)',
    },
    { // World 5: Neon-City (levels 8+)
        name: 'NEON',
        emoji: '✨',
        bg: '#0a0a1a',
        starColor: '#00ffaa',
        brickColors: ['#00ff88','#00ffcc','#00ccff','#4488ff','#8844ff','#cc44ff','#ff44cc'],
        particleColor: '#00ffaa',
        uiAccent: '#00ffcc',
        bgGlow: 'rgba(0,255,170,0.15)',
    },
];

// ═══════════════════════════════════════════���═══════════════════
// PADDLE SKINS
// ═══════════════════════════���═══════════════════════════════════
// name + unlock.label werden sowohl auf das Canvas (Floating-Text) als auch
// ins DOM (Skin-Grid) geschrieben. Beide sichtbaren Strings liegen daher
// bereits in Grossbuchstaben vor.
const PADDLE_SKINS = [
    { id:'default',  name:'STANDARD',   colors:['#aaaaff','#6666cc'], glow:'#8888ff',   unlock:null },
    { id:'neon',     name:'NEON',       colors:['#00ffaa','#00aa66'], glow:'#00ffaa',   unlock:{type:'score', value:2000,  label:'2.000 PUNKTE'} },
    { id:'fire',     name:'FLAMMEN',    colors:['#ff6622','#cc2200'], glow:'#ff4400',   unlock:{type:'score', value:5000,  label:'5.000 PUNKTE'} },
    { id:'ice',      name:'EIS',        colors:['#88ddff','#4488cc'], glow:'#44ccff',   unlock:{type:'level', value:3,     label:'LEVEL 3'} },
    { id:'rainbow',  name:'REGENBOGEN', colors:'rainbow',             glow:'#ff88ff',   unlock:{type:'level', value:5,     label:'LEVEL 5'} },
    { id:'gold',     name:'GOLD',       colors:['#ffd700','#cc9900'], glow:'#ffd700',   unlock:{type:'score', value:15000, label:'15.000 PUNKTE'} },
    { id:'pixel',    name:'PIXEL',      colors:['#88ff88','#448844'], glow:'#44ff44',   unlock:{type:'combo', value:15,    label:'15ER COMBO'} },
    { id:'galaxy',   name:'GALAXIE',    colors:'galaxy',              glow:'#aa44ff',   unlock:{type:'boss',  value:1,     label:'BOSS BESIEGT'} },
];

// ═══════════════════════════════════════════════════════════════
// PUZZLE REWARD SYSTEM
// ═══════════════════════════════════════════════════════════════
class BreakoutPuzzle {
    constructor() {
        try {
            const saved = JSON.parse(localStorage.getItem('breakout_puzzle') || '{}');
            this.currentPuzzle = saved.puzzle || 0;
            this.revealedPieces = saved.pieces || 0;
        } catch(e) {
            this.currentPuzzle = 0;
            this.revealedPieces = 0;
        }
        this.totalPieces = 9;
        // Each puzzle is a procedural pattern with different colors
        this.puzzleThemes = [
            { name: 'Sternennacht', bg: '#0a0a2e', colors: ['#ffcc44','#44bbff','#aa66ff'] },
            { name: 'Korallenriff', bg: '#0a1a2e', colors: ['#22ccaa','#ff66aa','#44ddff'] },
            { name: 'Feuervogel',   bg: '#1a0a0a', colors: ['#ff4400','#ffcc22','#ff8844'] },
            { name: 'Regenbogen',   bg: '#1a0a20', colors: ['#ff4466','#44ff88','#44bbff'] },
        ];
        this._createDOM();
        this._render();
    }

    _createDOM() {
        if (document.getElementById('puzzle-container')) return;
        const el = document.createElement('div');
        el.id = 'puzzle-container';
        el.innerHTML = '<canvas id="puzzle-canvas" width="90" height="90"></canvas><div id="puzzle-label"></div>';
        el.style.cssText = 'position:fixed;bottom:10px;right:10px;width:100px;background:rgba(10,10,46,0.85);border-radius:10px;border:2px solid rgba(255,204,68,0.4);padding:5px;z-index:50;text-align:center;cursor:pointer;transition:opacity 0.3s;opacity:0.7;';
        el.addEventListener('mouseenter', () => el.style.opacity = '1');
        el.addEventListener('mouseleave', () => el.style.opacity = '0.7');
        document.body.appendChild(el);
        const label = document.getElementById('puzzle-label');
        label.style.cssText = 'color:#ccccff;font-size:0.6rem;font-weight:600;margin-top:2px;';
    }

    revealNextPiece() {
        this.revealedPieces++;
        if (this.revealedPieces >= this.totalPieces) {
            // Puzzle complete! Advance to next
            this.currentPuzzle = (this.currentPuzzle + 1) % this.puzzleThemes.length;
            this.revealedPieces = 0;
        }
        this._save();
        this._render();
    }

    _save() {
        try { localStorage.setItem('breakout_puzzle', JSON.stringify({ puzzle: this.currentPuzzle, pieces: this.revealedPieces })); } catch(e) {}
    }

    _render() {
        const canvas = document.getElementById('puzzle-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const theme = this.puzzleThemes[this.currentPuzzle % this.puzzleThemes.length];
        const sz = 30; // each piece is 30x30
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, 90, 90);
        for (let i = 0; i < this.totalPieces; i++) {
            const row = Math.floor(i / 3), col = i % 3;
            const x = col * sz, y = row * sz;
            if (i < this.revealedPieces) {
                // Draw revealed piece with procedural pattern
                const c = theme.colors[i % theme.colors.length];
                ctx.fillStyle = c;
                ctx.globalAlpha = 0.8;
                ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
                // Pattern inside
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(x + sz/2, y + sz/2, 8 + (i%3)*2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else {
                // Unrevealed: dark with question mark
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.font = 'bold 12px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('?', x + sz/2, y + sz/2 + 4);
            }
        }
        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(i * sz, 0); ctx.lineTo(i * sz, 90); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * sz); ctx.lineTo(90, i * sz); ctx.stroke();
        }
        const label = document.getElementById('puzzle-label');
        if (label) label.textContent = theme.name + ' ' + this.revealedPieces + '/' + this.totalPieces;
    }
}

function getWorldForLevel(levelIndex) {
    if (levelIndex < 2) return 0;
    if (levelIndex < 4) return 1;
    if (levelIndex < 6) return 2;
    if (levelIndex < 8) return 3;
    return 4;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
function rndi(lo, hi) { return Math.floor(rnd(lo, hi + 1)); }
function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
}

// ═══════════════════════════════════════════════════════════════
// AUDIO ENGINE - Procedural music + SFX
// ═══════════════════════════════════════════════════════════════
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        // onBeatCallback wird fuer optionale VFX-Beat-Animationen verwendet.
        // Hintergrundmusik kommt jetzt ueber den Shared MusicManager (MP3-Tracks);
        // diese AudioEngine liefert nur noch SFX. Der Callback bleibt als
        // No-Op-Attrappe bestehen, damit bestehende Aufrufer (Game) nichts aendern muessen.
        this.onBeatCallback = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.masterGain);
    }

    // Hintergrundmusik-Steuerung wurde an den Shared MusicManager abgegeben.
    // Die alten startMusic/stopMusic/pauseMusic/resumeMusic/setMusicMuted sind
    // absichtlich entfernt; setCombo wird fuer Musikdynamik nicht mehr benoetigt
    // und wurde ebenfalls entfernt.

    // SFX
    sfx(type, param) {
        this.init();
        const t = this.ctx.currentTime;
        try { this['_sfx_' + type]?.(t, param); } catch(e) {}
    }

    _sfx_brickHit(t, row = 0) {
        const freqs = [523, 587, 659, 698, 784, 880, 988];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.value = freqs[row % 7];
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.1);
    }

    _sfx_paddleHit(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = 330;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.08);
    }

    _sfx_wallHit(t, side = 'side') {
        // Kurzer, freundlicher "Bloop". Seitenwaende hell, Decke etwas tiefer.
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const freq = side === 'top' ? 520 : 720;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.06);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.08);
    }

    _sfx_loseLife(t) {
        [300, 250, 200, 150].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.1, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.12);
        });
    }

    _sfx_win(t) {
        [523, 659, 784, 880, 1047, 1319].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.1, t + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.3);
        });
    }

    _sfx_levelUp(t) {
        [392, 494, 587, 659, 784, 880].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.1, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
        });
    }

    _sfx_partyActivate(t) {
        [440, 554, 659, 880, 1108, 1318].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, t + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.12);
        });
    }

    _sfx_powerup(t) {
        [880, 1108, 1318].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.1);
        });
    }

    _sfx_explosion(t) {
        const bufSize = this.ctx.sampleRate * 0.3;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        src.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
        src.start(t); src.stop(t + 0.3);
        // Sub boom
        const osc = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.25);
        g2.gain.setValueAtTime(0.3, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g2); g2.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.25);
    }

    _sfx_steel(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.15);
    }

    _sfx_laser(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.06);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.06);
    }

    _sfx_shield(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.1);
        osc.frequency.linearRampToValueAtTime(300, t + 0.2);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.2);
    }

    _sfx_extraLife(t) {
        [523, 659, 784, 1047].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.1, t + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.2);
        });
    }

    _sfx_encourage(t) {
        [250, 330, 440].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, t + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.2);
        });
    }

    _sfx_gold(t) {
        [1047, 1319, 1568].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f;
            gain.gain.setValueAtTime(0.08, t + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.15);
            osc.connect(gain); gain.connect(this.sfxGain);
            osc.start(t + i * 0.05); osc.stop(t + i * 0.05 + 0.15);
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM - Object pooled particles
// ═══════════════════════════════════════════════════════════════
class ParticleSystem {
    constructor(maxParticles = 600) {
        this.pool = [];
        for (let i = 0; i < maxParticles; i++) {
            this.pool.push({ active: false, x:0, y:0, dx:0, dy:0, life:0, color:'#fff', size:2, gravity:0, rotation:0, rotSpeed:0, isRect:false, w:0, h:0 });
        }
    }

    spawn(x, y, color, count = 6, opts = {}) {
        for (let i = 0; i < count; i++) {
            const p = this.pool.find(p => !p.active);
            if (!p) return;
            const angle = Math.random() * Math.PI * 2;
            const speed = (opts.speed || 2) + Math.random() * (opts.speedVar || 2);
            p.active = true;
            p.x = x; p.y = y;
            p.dx = Math.cos(angle) * speed;
            p.dy = Math.sin(angle) * speed;
            p.life = 1;
            p.color = opts.randomColor ? `hsl(${Math.random()*360},100%,60%)` : color;
            p.size = (opts.size || 2) + Math.random() * (opts.sizeVar || 3);
            p.gravity = opts.gravity || 0;
            p.decay = opts.decay || 0.025;
            p.isRect = opts.isRect || false;
            p.w = opts.w || 0;
            p.h = opts.h || 0;
            p.rotation = Math.random() * Math.PI * 2;
            p.rotSpeed = (Math.random() - 0.5) * 0.3;
        }
    }

    spawnShatter(x, y, w, h, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const p = this.pool.find(p => !p.active);
            if (!p) continue;
            p.active = true;
            p.x = x + Math.random() * w;
            p.y = y + Math.random() * h;
            p.dx = (Math.random() - 0.5) * 4;
            p.dy = -1 - Math.random() * 3;
            p.life = 1;
            p.color = color;
            p.size = 0;
            p.gravity = 0.15;
            p.decay = 0.018;
            p.isRect = true;
            p.w = 3 + Math.random() * 6;
            p.h = 2 + Math.random() * 4;
            p.rotation = Math.random() * Math.PI;
            p.rotSpeed = (Math.random() - 0.5) * 0.4;
        }
    }

    update() {
        for (const p of this.pool) {
            if (!p.active) continue;
            p.x += p.dx;
            p.y += p.dy;
            p.dy += p.gravity;
            p.rotation += p.rotSpeed;
            p.life -= p.decay;
            if (p.life <= 0) p.active = false;
        }
    }

    draw(ctx) {
        for (const p of this.pool) {
            if (!p.active) continue;
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            if (p.isRect) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// VISUAL EFFECTS
// ═══════════════════════════════════════════════════════════════
class VisualEffects {
    constructor() {
        // Starfield
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            const layer = i < 40 ? 0 : i < 65 ? 1 : 2;
            this.stars.push({
                x: Math.random() * W, y: Math.random() * H,
                speed: [0.2, 0.5, 1.0][layer],
                size: [1, 1.5, 2.5][layer],
                brightness: [0.3, 0.5, 0.8][layer]
            });
        }
        this.flashAlpha = 0;
        this.flashColor = '#fff';
        this.lightningBolts = [];
        this.chromaticOffset = 0;
        this.zoomFactor = 1.0;
        this.warpSpeed = 0;
        this.beatPulse = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.floatingTexts = [];
    }

    triggerShake(intensity) {
        this.shakeTimer = 10;
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    flash(color = '#fff', alpha = 0.3) {
        this.flashColor = color;
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }

    addLightning(x1, y1, x2, y2) {
        this.lightningBolts.push({ x1, y1, x2, y2, life: 8 });
    }

    triggerZoom() {
        this.zoomFactor = 1.06;
    }

    addFloatingText(x, y, text, color = '#ffcc44') {
        // Stack-avoidance: if another text is within 40px vertically, offset this one below
        let adjustedY = y;
        for (const ft of this.floatingTexts) {
            if (ft.life > 20 && Math.abs(ft.x - x) < 200 && Math.abs(ft.y - adjustedY) < 40) {
                adjustedY = ft.y + 44;
            }
        }
        this.floatingTexts.push({ x, y: adjustedY, text, color, life: 80, dy: -1.5 });
    }

    update(combo, partyMode) {
        // Flash decay
        this.flashAlpha *= 0.85;
        if (this.flashAlpha < 0.01) this.flashAlpha = 0;
        // Shake decay
        if (this.shakeTimer > 0) this.shakeTimer--;
        else this.shakeIntensity *= 0.8;
        // Lightning
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
            this.lightningBolts[i].life--;
            if (this.lightningBolts[i].life <= 0) this.lightningBolts.splice(i, 1);
        }
        // Chromatic aberration
        this.chromaticOffset = lerp(this.chromaticOffset, partyMode ? 3 : 0, 0.1);
        // Zoom decay
        this.zoomFactor = lerp(this.zoomFactor, 1.0, 0.1);
        // Warp speed
        const targetWarp = combo > 15 ? Math.min((combo - 15) / 10, 1.0) : 0;
        this.warpSpeed = lerp(this.warpSpeed, partyMode ? 1.0 : targetWarp, 0.03);
        if (this.warpSpeed > 0.01) document.body.classList.add('warp-mode');
        else document.body.classList.remove('warp-mode');
        // Beat pulse decay
        this.beatPulse *= 0.8;
        // Starfield
        const starMult = 1 + this.warpSpeed * 8;
        for (const star of this.stars) {
            star.y += star.speed * starMult;
            if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
        }
        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.dy;
            ft.life--;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    drawBackground(ctx, partyMode, theme) {
        // Starfield
        const starColor = theme ? theme.starColor : '#ccccff';
        for (const star of this.stars) {
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = partyMode ? `hsl(${(Date.now()/10 + star.x)%360},100%,80%)` : starColor;
            if (this.warpSpeed > 0.3) {
                const len = star.speed * this.warpSpeed * 20;
                ctx.fillRect(star.x, star.y, 1, len);
            } else {
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }
        ctx.globalAlpha = 1;
        // Beat pulse
        if (this.beatPulse > 0.01) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = this.beatPulse * (partyMode ? 0.15 : 0.06);
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
    }

    drawOverlays(ctx) {
        // Screen flash
        if (this.flashAlpha > 0.01) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }
        // Lightning
        for (const bolt of this.lightningBolts) {
            const alpha = bolt.life / 8;
            this._drawLightning(ctx, bolt.x1, bolt.y1, bolt.x2, bolt.y2, alpha);
        }
        // Floating texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, ft.life / 20);
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    _drawLightning(ctx, x1, y1, x2, y2, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const segments = 6;
        const dx = (x2 - x1) / segments;
        const dy = (y2 - y1) / segments;
        // Glow
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < segments; i++) {
            ctx.lineTo(x1 + dx * i + (Math.random() - 0.5) * 20, y1 + dy * i + (Math.random() - 0.5) * 20);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // Core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        for (let i = 1; i < segments; i++) {
            ctx.lineTo(x1 + dx * i + (Math.random() - 0.5) * 12, y1 + dy * i + (Math.random() - 0.5) * 12);
        }
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    applyTransforms(ctx) {
        // Zoom
        if (Math.abs(this.zoomFactor - 1.0) > 0.001) {
            ctx.translate(W / 2, H / 2);
            ctx.scale(this.zoomFactor, this.zoomFactor);
            ctx.translate(-W / 2, -H / 2);
        }
        // Shake
        if (this.shakeTimer > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeIntensity,
                (Math.random() - 0.5) * this.shakeIntensity
            );
        }
    }

    onBeat(partyMode) {
        this.beatPulse = partyMode ? 0.5 : 0.15;
    }
}

// ═══════════════════════════════════════════════════════════════
// BRICK
// ═══════════════════════════════════════════════════════════════
class Brick {
    constructor(x, y, type = 'normal', row = 0, col = 0) {
        this.x = x; this.y = y;
        this.w = BRICK_W; this.h = BRICK_H;
        this.type = type;
        this.row = row; this.col = col;
        this.alive = true;
        this.hp = type === 'multihit' ? (row < 2 ? 3 : 2) : (type === 'steel' ? Infinity : 1);
        this.maxHp = this.hp;
        this.moveDir = type === 'moving' ? (Math.random() < 0.5 ? 1 : -1) : 0;
        this.moveSpeed = 0.5;
        this.originX = x;
        this.moveRange = (BRICK_W + BRICK_PAD) * 1.5;
        this.sparkleTimer = 0;
        this.hitFlash = 0;
        // Animations
        this.animPhase = Math.random() * Math.PI * 2;
        this.breathing = false;
        this.descending = false;
        this.descendSpeed = 0;
    }

    getColor(partyMode, worldIndex) {
        if (partyMode) return `hsl(${(Date.now()/5 + this.x + this.y)%360},80%,55%)`;
        const colors = (worldIndex !== undefined && WORLD_THEMES[worldIndex])
            ? WORLD_THEMES[worldIndex].brickColors : ROW_COLORS;
        switch (this.type) {
            case 'steel': return '#99aabc';
            case 'multihit':
                if (this.hp >= 3) return '#44ff88';
                if (this.hp >= 2) return '#ffcc44';
                return '#ff4466';
            case 'explosive': return '#ff6622';
            case 'moving': return colors[this.row % colors.length];
            case 'gold': return '#ffd700';
            default: return colors[this.row % colors.length];
        }
    }

    update() {
        if (!this.alive) return;
        if (this.hitFlash > 0) this.hitFlash--;
        this.animPhase += 0.04;
        if (this.type === 'moving') {
            this.x += this.moveSpeed * this.moveDir;
            if (this.x > this.originX + this.moveRange || this.x < this.originX - this.moveRange) {
                this.moveDir *= -1;
            }
            this.x = clamp(this.x, 2, W - this.w - 2);
        }
        if (this.type === 'gold') {
            this.sparkleTimer++;
        }
        if (this.descending) {
            this.y += this.descendSpeed;
        }
    }

    draw(ctx, partyMode, worldIndex) {
        if (!this.alive) return;
        const color = this.getColor(partyMode, worldIndex);
        ctx.save();
        // Glow
        if (this.type === 'explosive' || this.type === 'gold' || partyMode) {
            ctx.shadowColor = color;
            ctx.shadowBlur = partyMode ? 12 : 6;
        }
        // Flash on hit
        if (this.hitFlash > 0) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
        }
        ctx.fillStyle = color;
        // Subtle breathing via alpha/brightness (keeps collision box matching visuals)
        if (this.breathing) {
            const pulse = 1 + Math.sin(this.animPhase) * 0.08;
            ctx.globalAlpha = Math.min(1, 0.9 * pulse);
        }
        ctx.beginPath();
        roundRect(ctx, this.x, this.y, this.w, this.h, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, 3);
        // Type-specific decorations
        if (this.type === 'steel') {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            // Cross hatch
            for (let i = 0; i < this.w; i += 8) {
                ctx.beginPath(); ctx.moveTo(this.x + i, this.y); ctx.lineTo(this.x + i + 6, this.y + this.h); ctx.stroke();
            }
        }
        if (this.type === 'multihit' && this.hp < this.maxHp) {
            // Crack lines
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy - 3); ctx.lineTo(cx + 2, cy + 4);
            ctx.stroke();
        }
        if (this.type === 'explosive') {
            // Pulsing glow
            const pulse = 0.5 + Math.sin(Date.now() / 200) * 0.3;
            ctx.fillStyle = `rgba(255,100,0,${pulse})`;
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.w / 2, this.y + this.h - 4);
        }
        if (this.type === 'gold' && this.sparkleTimer % 30 < 15) {
            ctx.fillStyle = 'rgba(255,255,200,0.6)';
            const sx = this.x + (this.sparkleTimer * 3) % this.w;
            ctx.beginPath();
            ctx.arc(sx, this.y + this.h / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.type === 'moving') {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '8px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(this.moveDir > 0 ? '>' : '<', this.x + this.w / 2, this.y + this.h - 5);
        }
        ctx.restore();
    }

    hit() {
        if (this.type === 'steel') return false;
        this.hp--;
        this.hitFlash = 6;
        if (this.hp <= 0) { this.alive = false; return true; }
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// BALL
// ═══════════════════════════════════════════════════════════════
class Ball {
    constructor(x, y, dx, dy, speed) {
        this.x = x; this.y = y;
        this.dx = dx; this.dy = dy;
        this.r = 7;
        this.speed = speed;
        this.alive = true;
        this.trail = [];
        this.fireball = false;
        this.bomb = false;
        this.stuck = false; // magnet
        this.stuckOffset = 0;
        this.stuckTimer = 0;       // frames since last paddle contact
        this.lastPaddleHit = 0;    // frame counter of last paddle hit
    }

    update(speedMult = 1) {
        if (this.stuck) return;
        this.x += this.dx * speedMult;
        this.y += this.dy * speedMult;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 14) this.trail.shift();
        // Stuck detection: if ball stays in upper third too long, nudge it down
        this.stuckTimer++;
        if (this.stuckTimer > 300 && this.y < H * 0.35) {
            // Force ball downward with a strong angle
            const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dy = Math.abs(currentSpeed) * 0.85;
            this.dx = (Math.random() - 0.5) * currentSpeed * 0.6;
            this.stuckTimer = 0;
        }
    }

    draw(ctx, partyMode, chromaticOffset = 0) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = i / this.trail.length;
            ctx.globalAlpha = t * 0.3;
            ctx.fillStyle = this.fireball ? '#ff8844' : (partyMode ? `hsl(${(Date.now()/3+i*30)%360},100%,60%)` : '#fff');
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.r * t, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Chromatic aberration
        if (chromaticOffset > 0.5) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#ff0000'; ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(this.x - chromaticOffset, this.y, this.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#0000ff'; ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(this.x + chromaticOffset, this.y, this.r, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }
        // Main ball
        const color = this.fireball ? '#ff8844' : (this.bomb ? '#cc2200' : (partyMode ? `hsl(${Date.now()/4%360},100%,70%)` : '#ffffff'));
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = partyMode ? 25 : (this.fireball ? 20 : 12);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Bomb indicator
        if (this.bomb) {
            const pulse = 0.5 + Math.sin(Date.now() / 100) * 0.5;
            ctx.strokeStyle = `rgba(255,100,0,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Fireball aura
        if (this.fireball) {
            ctx.strokeStyle = `rgba(255,200,0,${0.3 + Math.sin(Date.now()/80)*0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    getAngle() {
        return Math.atan2(this.dy, this.dx);
    }

    setAngle(angle, speed) {
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
    }
}

// ═══════════════════════════════════════════════════════════════
// PADDLE
// ═══════════════════════════════════════════════════════════════
class Paddle {
    constructor() {
        this.baseW = 80;
        this.w = 80;
        this.h = 12;
        this.x = (W - this.w) / 2;
        this.y = H - 30;
        this.speed = 7;
        this.color = '#8888ff';
        this.laserActive = false;
        this.laserTimer = 0;
        this.laserCooldown = 0;
        this.laserInterval = 12;
        this.lasers = [];
        this.magnetActive = false;
    }

    update(inputDir, mouseX, useMouse) {
        if (useMouse) {
            const target = mouseX - this.w / 2;
            this.x += (target - this.x) * 0.3;
        } else {
            this.x += inputDir * this.speed;
        }
        this.x = clamp(this.x, 0, W - this.w);
        // Lasers
        if (this.laserActive) {
            this.laserTimer--;
            if (this.laserTimer <= 0) { this.laserActive = false; }
            this.laserCooldown--;
            if (this.laserCooldown <= 0) {
                this.lasers.push({ x: this.x + this.w / 2, y: this.y - 4, dy: -8 });
                this.laserCooldown = this.laserInterval;
            }
        }
        // Update laser bolts
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].y += this.lasers[i].dy;
            if (this.lasers[i].y < 0) this.lasers.splice(i, 1);
        }
    }

    draw(ctx, partyMode, skin) {
        ctx.save();
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
        if (partyMode) {
            grad.addColorStop(0, `hsl(${Date.now()/5%360},100%,65%)`);
            grad.addColorStop(1, `hsl(${(Date.now()/5+60)%360},100%,45%)`);
        } else if (this.laserActive) {
            grad.addColorStop(0, '#ff6666');
            grad.addColorStop(1, '#cc2222');
        } else if (this.magnetActive) {
            grad.addColorStop(0, '#bb77ff');
            grad.addColorStop(1, '#8833cc');
        } else if (skin && skin.colors === 'rainbow') {
            grad.addColorStop(0, `hsl(${Date.now()/12%360},90%,60%)`);
            grad.addColorStop(1, `hsl(${(Date.now()/12+60)%360},90%,40%)`);
        } else if (skin && skin.colors === 'galaxy') {
            grad.addColorStop(0, `hsl(${(Date.now()/20)%360},70%,30%)`);
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, `hsl(${(Date.now()/20+120)%360},70%,30%)`);
        } else if (skin && Array.isArray(skin.colors)) {
            grad.addColorStop(0, skin.colors[0]);
            grad.addColorStop(1, skin.colors[1]);
        } else {
            grad.addColorStop(0, '#aaaaff');
            grad.addColorStop(1, '#6666cc');
        }
        ctx.fillStyle = grad;
        const glowColor = (skin && !partyMode && !this.laserActive && !this.magnetActive)
            ? skin.glow : (this.laserActive ? '#ff4444' : (this.magnetActive ? '#aa44ff' : '#8888ff'));
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = partyMode ? 15 : 8;
        ctx.beginPath();
        roundRect(ctx, this.x, this.y, this.w, this.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Draw lasers
        for (const laser of this.lasers) {
            ctx.fillStyle = '#ff4444';
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 8;
            ctx.fillRect(laser.x - 1, laser.y, 2, 10);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }

    setWidth(w) {
        const center = this.x + this.w / 2;
        this.w = w;
        this.x = clamp(center - w / 2, 0, W - w);
    }

    activateLaser(duration) {
        this.laserActive = true;
        this.laserTimer = duration;
        this.laserCooldown = 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// POWERUP
// ═══════════════════════════════════════════════════════════════
class PowerUp {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.type = type;
        this.w = 28; this.h = 14;
        this.dy = 1.5;
        this.alive = true;
        this.rotation = 0;
        this.glowPhase = Math.random() * Math.PI * 2;
    }

    update() {
        this.y += this.dy;
        this.rotation += 0.05;
        this.glowPhase += 0.1;
        if (this.y > H + 20) this.alive = false;
    }

    draw(ctx) {
        if (!this.alive) return;
        const color = POWERUP_COLORS[this.type];
        const glow = 0.5 + Math.sin(this.glowPhase) * 0.3;
        const isGood = POWERUP_GOOD[this.type];
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        // Subtile Wirkungseffekte oberhalb (Feuer flackert, Bombe zischt, ...)
        this._drawEffect(ctx);
        if (!isGood) {
            ctx.strokeStyle = '#ff2222';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(this.w, this.h) / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * glow;
        ctx.fillStyle = color;
        this._drawShape(ctx);
        ctx.shadowBlur = 0;
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_EMOJI[this.type] || POWERUP_SYMBOLS[this.type], 0, 1);
        ctx.restore();
    }

    _drawShape(ctx) {
        const w = this.w, h = this.h;
        switch (this.type) {
            case 'multiball': {
                ctx.beginPath();
                ctx.arc(0, 0, h * 0.85, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'laser': {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.9);
                ctx.lineTo(w * 0.45, h * 0.2);
                ctx.lineTo(w * 0.2, h * 0.2);
                ctx.lineTo(w * 0.2, h * 0.8);
                ctx.lineTo(-w * 0.2, h * 0.8);
                ctx.lineTo(-w * 0.2, h * 0.2);
                ctx.lineTo(-w * 0.45, h * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'giant': {
                ctx.beginPath();
                roundRect(ctx, -w * 0.6, -h * 0.45, w * 1.2, h * 0.9, h * 0.45);
                ctx.fill();
                break;
            }
            case 'tiny': {
                ctx.beginPath();
                ctx.arc(0, 0, h * 0.55, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'fireball': {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.9);
                ctx.bezierCurveTo(w * 0.5, -h * 0.2, w * 0.45, h * 0.6, 0, h * 0.9);
                ctx.bezierCurveTo(-w * 0.45, h * 0.6, -w * 0.5, -h * 0.2, 0, -h * 0.9);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'slowmo': {
                ctx.beginPath();
                ctx.moveTo(-w * 0.4, -h * 0.9);
                ctx.lineTo(w * 0.4, -h * 0.9);
                ctx.lineTo(-w * 0.25, 0);
                ctx.lineTo(w * 0.4, h * 0.9);
                ctx.lineTo(-w * 0.4, h * 0.9);
                ctx.lineTo(w * 0.25, 0);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'speeddemon': {
                for (let i = 0; i < 3; i++) {
                    const cx = (i - 1) * w * 0.28;
                    ctx.beginPath();
                    ctx.moveTo(cx - w * 0.15, -h * 0.8);
                    ctx.lineTo(cx + w * 0.15, 0);
                    ctx.lineTo(cx - w * 0.15, h * 0.8);
                    ctx.lineTo(cx - w * 0.02, 0);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            }
            case 'shield': {
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.95);
                ctx.lineTo(w * 0.5, -h * 0.4);
                ctx.lineTo(w * 0.4, h * 0.5);
                ctx.lineTo(0, h * 0.95);
                ctx.lineTo(-w * 0.4, h * 0.5);
                ctx.lineTo(-w * 0.5, -h * 0.4);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'magnet': {
                ctx.beginPath();
                ctx.moveTo(-w * 0.5, -h * 0.9);
                ctx.lineTo(-w * 0.5, h * 0.9);
                ctx.lineTo(-w * 0.15, h * 0.9);
                ctx.lineTo(-w * 0.15, -h * 0.3);
                ctx.lineTo(w * 0.15, -h * 0.3);
                ctx.lineTo(w * 0.15, h * 0.9);
                ctx.lineTo(w * 0.5, h * 0.9);
                ctx.lineTo(w * 0.5, -h * 0.9);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'bomb': {
                ctx.beginPath();
                ctx.arc(0, h * 0.1, h * 0.85, 0, Math.PI * 2);
                ctx.fill();
                // Zunder
                ctx.strokeStyle = '#8b5a2b';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(w * 0.15, -h * 0.5);
                ctx.quadraticCurveTo(w * 0.5, -h * 1.3, w * 0.1, -h * 1.7);
                ctx.stroke();
                break;
            }
            default: {
                ctx.beginPath();
                roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
                ctx.fill();
            }
        }
    }

    _drawEffect(ctx) {
        const t = Date.now() / 100;
        switch (this.type) {
            case 'fireball': {
                // Flackernde Flamme oberhalb
                for (let i = 0; i < 4; i++) {
                    const fx = (Math.random() - 0.5) * this.w * 0.7;
                    const fy = -this.h - 4 - Math.random() * 8;
                    const fr = 1.5 + Math.random() * 2;
                    ctx.globalAlpha = 0.35 + Math.random() * 0.35;
                    ctx.fillStyle = i < 2 ? '#ff3322' : '#ffaa44';
                    ctx.beginPath();
                    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'bomb': {
                // Zischender Funke
                ctx.globalAlpha = 0.7 + Math.sin(t * 3) * 0.3;
                ctx.fillStyle = '#ffee44';
                ctx.beginPath();
                ctx.arc(this.w * 0.1 + (Math.random() - 0.5) * 3, -this.h - 4 + (Math.random() - 0.5) * 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
            }
            case 'slowmo': {
                // Pulsierende Zeit-Ringe
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.25;
                ctx.lineWidth = 1;
                const r = (t * 0.6) % this.h + this.h * 0.6;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            }
            case 'speeddemon': {
                // Speed-Linien
                ctx.strokeStyle = '#ffff44';
                ctx.globalAlpha = 0.45;
                ctx.lineWidth = 1.5;
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-this.w * 0.6, i * 4);
                    ctx.lineTo(-this.w * 1.1, i * 4 + 1);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'magnet': {
                // Magnetfeld-Linien
                ctx.strokeStyle = '#aa44ff';
                ctx.globalAlpha = 0.35;
                ctx.lineWidth = 1;
                for (let i = 0; i < 2; i++) {
                    ctx.beginPath();
                    ctx.arc(0, -this.h * 0.2, this.w * (0.8 + i * 0.3), -Math.PI * 0.85, -Math.PI * 0.15);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'shield': {
                // Schimmer-Aura
                ctx.strokeStyle = '#88ccff';
                ctx.globalAlpha = 0.3 + Math.sin(t) * 0.2;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, this.w * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                break;
            }
            case 'multiball': {
                // Orbitierende Satellitenpunkte
                ctx.fillStyle = '#44ffff';
                ctx.globalAlpha = 0.75;
                for (let i = 0; i < 3; i++) {
                    const a = t * 0.1 + (i * Math.PI * 2 / 3);
                    const ox = Math.cos(a) * this.w * 0.85;
                    const oy = Math.sin(a) * this.h * 0.85;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                break;
            }
            case 'laser': {
                // Laser-Funken ueber der Spitze
                ctx.fillStyle = '#ff6666';
                ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.35;
                ctx.beginPath();
                ctx.arc(0, -this.h - 4, 1.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
            }
        }
    }

    hitsPaddle(paddle) {
        return this.alive &&
            this.x + this.w > paddle.x &&
            this.x < paddle.x + paddle.w &&
            this.y + this.h > paddle.y &&
            this.y < paddle.y + paddle.h;
    }
}

// ═══════════════════════════════════════════════════════════════
// POWERUP MANAGER
// ═══════════════════════════════════════════════════════════════
class PowerUpManager {
    constructor() {
        this.falling = [];
        this.activeEffects = {}; // type -> remaining frames
        this.shields = 0;
        this.maxFalling = 3;
        this.activeCombo = null;
        this.comboJustActivated = null; // set to combo id for one frame when a combo triggers
    }

    trySpawn(x, y, partyMode, kidsMode) {
        if (this.falling.length >= this.maxFalling) return;
        const chance = partyMode ? 0.5 : 0.25;
        if (Math.random() > chance) return;
        // Kids-Mode: nur positive Power-ups spawnen. Keine tiny/speeddemon/bomb
        // fuer 3-4jaehrige - die verstehen nicht, dass das Paddle absichtlich
        // kleiner wird oder der Ball zufaellig explodiert.
        const weights = kidsMode
            ? Object.fromEntries(Object.entries(POWERUP_WEIGHTS).filter(([t]) => POWERUP_GOOD[t]))
            : POWERUP_WEIGHTS;
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let type = 'multiball';
        for (const [t, w] of Object.entries(weights)) {
            r -= w;
            if (r <= 0) { type = t; break; }
        }
        this.falling.push(new PowerUp(x, y, type));
    }

    update(paddle) {
        const collected = [];
        for (let i = this.falling.length - 1; i >= 0; i--) {
            this.falling[i].update();
            if (!this.falling[i].alive) { this.falling.splice(i, 1); continue; }
            if (this.falling[i].hitsPaddle(paddle)) {
                collected.push(this.falling[i].type);
                this.falling.splice(i, 1);
            }
        }
        // Tick active effects
        for (const type in this.activeEffects) {
            this.activeEffects[type]--;
            if (this.activeEffects[type] <= 0) delete this.activeEffects[type];
        }
        return collected;
    }

    activate(type) {
        const dur = POWERUP_DURATIONS[type];
        if (dur) {
            // Mutually exclusive groups
            if (type === 'giant' || type === 'tiny') {
                delete this.activeEffects.giant;
                delete this.activeEffects.tiny;
            }
            if (type === 'slowmo' || type === 'speeddemon') {
                delete this.activeEffects.slowmo;
                delete this.activeEffects.speeddemon;
            }
            this.activeEffects[type] = dur;
        }
        if (type === 'shield') {
            this.shields = Math.min(this.shields + 1, 2);
        }
    }

    isActive(type) {
        return !!this.activeEffects[type];
    }

    getSpeedMult() {
        if (this.isActive('slowmo')) return 0.5;
        if (this.isActive('speeddemon')) return 1.8;
        return 1;
    }

    getScoreMult() {
        let mult = 1;
        if (this.activeCombo && this.activeCombo.id === 'precision') mult *= 5;
        if (this.isActive('tiny')) mult *= 3;
        if (this.isActive('speeddemon')) mult *= 3;
        return mult;
    }

    drawHUD(ctx) {
        let i = 0;
        for (const [type, frames] of Object.entries(this.activeEffects)) {
            const dur = POWERUP_DURATIONS[type] || 600;
            const frac = frames / dur;
            const color = POWERUP_COLORS[type];
            const bx = 8 + i * 40;
            const by = 4;
            // Background bar
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(bx, by, 34, 12);
            // Fill bar
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(bx, by, 34 * frac, 12);
            ctx.globalAlpha = 1;
            // Letter
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(POWERUP_SYMBOLS[type], bx + 17, by + 10);
            i++;
        }
        // Shield indicator
        if (this.shields > 0) {
            ctx.fillStyle = '#4488ff';
            ctx.font = 'bold 9px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText('SHIELD x' + this.shields, W - 8, 14);
        }
        // Active combo indicator
        if (this.activeCombo) {
            const pulse = 0.7 + Math.sin(Date.now() / 150) * 0.3;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = this.activeCombo.color;
            ctx.font = 'bold 13px system-ui';
            ctx.textAlign = 'center';
            ctx.shadowColor = this.activeCombo.color;
            ctx.shadowBlur = 12;
            ctx.fillText(this.activeCombo.name, W / 2, 44);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }

    drawFalling(ctx) {
        for (const pu of this.falling) pu.draw(ctx);
    }

    drawShield(ctx) {
        if (this.shields <= 0) return;
        for (let i = 0; i < this.shields; i++) {
            const sy = H - 8 - i * 5;
            const pulse = 0.4 + Math.sin(Date.now() / 300 + i) * 0.2;
            ctx.strokeStyle = `rgba(68,136,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, sy); ctx.lineTo(W, sy);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    checkShield(ballY) {
        if (this.shields > 0 && ballY > H - 13) {
            this.shields--;
            return true;
        }
        return false;
    }

    checkCombos(ballCount) {
        this.comboJustActivated = null;
        let found = null;
        for (const combo of POWERUP_COMBOS) {
            const met = combo.requires.every(req => {
                if (req === 'multiball') return ballCount >= 3;
                if (req === 'shield') return this.shields > 0;
                return this.isActive(req);
            });
            if (met) { found = combo; break; }
        }
        if (found && (!this.activeCombo || this.activeCombo.id !== found.id)) {
            this.activeCombo = found;
            this.comboJustActivated = found;
        } else if (!found) {
            this.activeCombo = null;
        }
        return this.comboJustActivated;
    }

    reset() {
        this.falling = [];
        this.activeEffects = {};
        this.shields = 0;
        this.activeCombo = null;
        this.comboJustActivated = null;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEVEL MANAGER
// ═══════════════════════════════════════════════════════════════
class LevelManager {
    constructor() {
        this.currentLevel = 0;
        this.baseSpeeds = [4, 4.5, 5, 5, 5.5];
        // Per-level brick animation config
        this.levelAnims = [
            {},                                           // L1: static
            { breathing: true },                          // L2: breathing
            {},                                           // L3: static (fortress)
            { breathing: true },                          // L4: chain reaction breathing
            { breathing: true, descending: true, descendSpeed: 0.003 }, // L5: gauntlet
        ];
        // Grid notation: .=empty, #=normal, S=steel, 2=2hp, 3=3hp, X=explosive, M=moving, G=gold
        this.layouts = [
            // Level 1: Standard
            [
                '########',
                '########',
                '########',
                '########',
                '########',
                '########',
            ],
            // Level 2: Diamond with gold core
            [
                '...#.#..',
                '..#2G2#.',
                '.#2G3G2#',
                '..#2G2#.',
                '...#.#..',
                '........',
            ],
            // Level 3: Fortress
            [
                'S.MMMM.S',
                '########',
                '.M.S.S.M',
                '########',
                'M.####.M',
                'S..##..S',
            ],
            // Level 4: Chain Reaction
            [
                '#X##X##X',
                'X##X##X#',
                '##X#X###',
                '#X#G#X#G',
                'X##X##X#',
                '#X###X##',
            ],
            // Level 5: The Gauntlet
            [
                'SSSSSSSS',
                '3XMG.MX3',
                'M2#X.#2M',
                '##XGX###',
                '2M###M2.',
                '.#2X2#..',
            ],
        ];
    }

    generateLayout(levelIndex, kidsMode = false) {
        const difficulty = Math.min((levelIndex - 5) / 15, 1);
        const rows = 6;
        const layout = [];
        let pEmpty, pSteel, pMulti, pExplosive, pMoving;
        if (kidsMode) {
            pEmpty = Math.max(0.1, 0.3 - difficulty * 0.12);
            pSteel = levelIndex >= 5 ? Math.min(0.1, difficulty * 0.12) : 0;
            pMulti = levelIndex >= 7 ? Math.min(0.15, difficulty * 0.12) : 0;
            pExplosive = levelIndex >= 7 ? Math.min(0.08, difficulty * 0.08) : 0;
            pMoving = levelIndex >= 9 ? Math.min(0.06, difficulty * 0.06) : 0;
        } else {
            pEmpty = Math.max(0.08, 0.25 - difficulty * 0.15);
            pSteel = Math.min(0.18, difficulty * 0.2);
            pMulti = Math.min(0.25, 0.1 + difficulty * 0.18);
            pExplosive = Math.min(0.15, 0.05 + difficulty * 0.12);
            pMoving = Math.min(0.12, 0.03 + difficulty * 0.1);
        }
        const pGold = 0.04;
        // Generate symmetrical patterns for visual appeal
        const symmetry = Math.random() < 0.5;
        for (let r = 0; r < rows; r++) {
            let row = '';
            const half = symmetry ? Math.ceil(BRICK_COLS / 2) : BRICK_COLS;
            const chars = [];
            for (let c = 0; c < half; c++) {
                const roll = Math.random();
                let ch = '#';
                let cumul = 0;
                cumul += pEmpty; if (roll < cumul) { ch = '.'; }
                else { cumul += pSteel; if (roll < cumul) ch = 'S';
                else { cumul += pMulti; if (roll < cumul) ch = (Math.random() < 0.4 ? '3' : '2');
                else { cumul += pExplosive; if (roll < cumul) ch = 'X';
                else { cumul += pMoving; if (roll < cumul) ch = 'M';
                else { cumul += pGold; if (roll < cumul) ch = 'G'; }}}}}
                chars.push(ch);
            }
            if (symmetry) {
                const mirror = chars.slice(0, Math.floor(BRICK_COLS / 2)).reverse();
                row = chars.concat(mirror).join('');
            } else {
                row = chars.join('');
            }
            layout.push(row.substring(0, BRICK_COLS));
        }
        // Ensure at least one gold brick
        const flatCount = layout.join('').split('G').length - 1;
        if (flatCount === 0) {
            const r = rndi(0, rows - 1);
            const c = rndi(0, BRICK_COLS - 1);
            const arr = layout[r].split('');
            arr[c] = 'G';
            layout[r] = arr.join('');
        }
        return layout;
    }

    getBricks(levelIndex, kidsMode = false) {
        let layout;
        if (levelIndex < this.layouts.length) {
            layout = this.layouts[levelIndex];
        } else {
            layout = this.generateLayout(levelIndex, kidsMode);
        }
        const bricks = [];
        for (let r = 0; r < layout.length; r++) {
            const row = layout[r];
            for (let c = 0; c < BRICK_COLS; c++) {
                let ch = c < row.length ? row[c] : '.';
                if (ch === '.' || ch === ' ') continue;
                if (kidsMode) {
                    if (ch === 'S' && levelIndex < 6) ch = '#';
                    if ((ch === 'X' || ch === '2' || ch === '3') && levelIndex < 3) ch = '#';
                    if (ch === 'M' && levelIndex < 4) ch = '#';
                }
                const x = BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD);
                const y = BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD);
                let type = 'normal';
                if (ch === 'S') type = 'steel';
                else if (ch === '2') type = 'multihit';
                else if (ch === '3') { type = 'multihit'; }
                else if (ch === 'X') type = 'explosive';
                else if (ch === 'M') type = 'moving';
                else if (ch === 'G') type = 'gold';
                const brick = new Brick(x, y, type, r, c);
                if (ch === '3') { brick.hp = 3; brick.maxHp = 3; }
                const anim = levelIndex < this.levelAnims.length
                    ? this.levelAnims[levelIndex]
                    : { breathing: true, descending: levelIndex >= 8, descendSpeed: Math.min(0.008, 0.002 + (levelIndex - 7) * 0.001) };
                if (anim.breathing) brick.breathing = true;
                if (anim.descending && type !== 'steel') {
                    brick.descending = true;
                    brick.descendSpeed = anim.descendSpeed || 0.003;
                }
                bricks.push(brick);
            }
        }
        return bricks;
    }

    getBaseSpeed() {
        if (this.currentLevel < this.baseSpeeds.length) {
            return this.baseSpeeds[this.currentLevel];
        }
        // Endless mode: gradually increase, cap at 8
        return Math.min(8, 5.5 + (this.currentLevel - 4) * 0.15);
    }

    isLevelComplete(bricks) {
        return bricks.every(b => !b.alive || b.type === 'steel');
    }

    getNeighbors(bricks, brick) {
        return bricks.filter(b =>
            b.alive && b !== brick && b.type !== 'steel' &&
            Math.abs(b.row - brick.row) <= 1 && Math.abs(b.col - brick.col) <= 1
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// BOSS
// ═══════════════════════════════════════════════════════════════
class Boss {
    constructor(levelIndex, worldIndex, easyMode = false) {
        this.worldIndex = worldIndex;
        this.easyMode = easyMode;
        const bossNum = Math.floor(levelIndex / 5);
        this.type = ['kraken','phoenix','golem','dragon','hydra'][bossNum % 5];
        this.maxHp = easyMode ? 20 + bossNum * 5 : 30 + bossNum * 10;
        this.hp = this.maxHp;
        this.x = W / 2;
        this.y = 70;
        this.width = 160;
        this.height = 60;
        this.phase = 0;
        this.phaseTimer = 0;
        this.phaseDuration = 300;
        this.timer = 0;
        this.moveAngle = 0;
        this.projectiles = [];
        this.defeated = false;
        this.defeatTimer = 0;
        this.flashTimer = 0;
        this.weakPoints = this._initWeakPoints();
    }

    _initWeakPoints() {
        const r = this.easyMode ? 18 : 10;
        const rc = this.easyMode ? 20 : 12;
        return [
            { ox: -50, oy: 0, r: r, active: true, cooldown: 0 },
            { ox: 0, oy: -15, r: rc, active: true, cooldown: 0 },
            { ox: 50, oy: 0, r: r, active: true, cooldown: 0 },
        ];
    }

    update() {
        if (this.defeated) { this.defeatTimer++; return; }
        this.timer++;
        this.phaseTimer++;
        this.moveAngle += this.easyMode ? 0.012 : 0.02;
        const sway = Math.sin(this.moveAngle) * (W / 2 - this.width / 2 - 20);
        this.x = W / 2 + sway;
        if (this.easyMode) {
            for (const wp of this.weakPoints) {
                if (wp.cooldown > 0) wp.cooldown--;
                wp.active = true;
            }
            return;
        }
        if (this.phaseTimer >= this.phaseDuration) {
            this.phaseTimer = 0;
            this.phase = (this.phase + 1) % 3;
        }
        if (this.phase === 0 && this.timer % 50 === 0) {
            this.projectiles.push({ x: this.x + rnd(-30, 30), y: this.y + this.height / 2, dy: 2.2, dx: 0, r: 5, warn: 30 });
        }
        if (this.phase === 1 && this.timer % 32 === 0) {
            const spread = rnd(-80, 80);
            this.projectiles.push({ x: this.x + spread, y: this.y + this.height / 2 + 10, dy: 3.0, dx: spread * 0.01, r: 4, warn: 25 });
        }
        for (const wp of this.weakPoints) {
            if (wp.cooldown > 0) wp.cooldown--;
            wp.active = !(this.phase === 2 && this.phaseTimer < 60);
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (p.warn > 0) { p.warn--; continue; }
            p.y += p.dy;
            if (p.dx) p.x += p.dx;
            if (p.y > H + 10) this.projectiles.splice(i, 1);
        }
    }

    checkBallHit(ball) {
        if (this.defeated) return false;
        for (const wp of this.weakPoints) {
            if (!wp.active || wp.cooldown > 0) continue;
            const wpx = this.x + wp.ox, wpy = this.y + wp.oy;
            const dist = Math.sqrt((ball.x - wpx) ** 2 + (ball.y - wpy) ** 2);
            if (dist < ball.r + wp.r) {
                this.hp -= (ball.fireball ? 3 : 1);
                wp.cooldown = 15;
                this.flashTimer = 8;
                ball.dy = -Math.abs(ball.dy);
                if (this.hp <= 0) { this.hp = 0; this.defeated = true; }
                return true;
            }
        }
        // Body deflection
        const bx = this.x - this.width / 2, by = this.y - this.height / 2;
        if (ball.x + ball.r > bx && ball.x - ball.r < bx + this.width &&
            ball.y + ball.r > by && ball.y - ball.r < by + this.height) {
            ball.dy = Math.abs(ball.dy);
        }
        return false;
    }

    checkProjectileHitPaddle(paddle) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            if (p.warn > 0) continue;
            if (p.y + p.r >= paddle.y && p.y - p.r <= paddle.y + paddle.h &&
                p.x >= paddle.x && p.x <= paddle.x + paddle.w) {
                this.projectiles.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (this.defeated && this.defeatTimer > 60) return;
        ctx.save();
        const alpha = this.defeated ? Math.max(0, 1 - this.defeatTimer / 60) : 1;
        ctx.globalAlpha = alpha;
        const isFlash = this.flashTimer > 0;
        if (isFlash) this.flashTimer--;
        const colors = {
            kraken: ['#22aacc','#116688'],
            phoenix: ['#ff6622','#cc3300'],
            golem: ['#888888','#555555'],
            dragon: ['#44bb44','#227722'],
            hydra: ['#9944cc','#662288'],
        };
        const [c1, c2] = colors[this.type] || ['#888','#555'];
        const bx = this.x - this.width / 2;
        const by = this.y - this.height / 2;
        const grad = ctx.createLinearGradient(bx, by, bx, by + this.height);
        grad.addColorStop(0, isFlash ? '#ffffff' : c1);
        grad.addColorStop(1, isFlash ? '#cccccc' : c2);
        ctx.fillStyle = grad;
        ctx.shadowColor = c1;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        roundRect(ctx, bx, by, this.width, this.height, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Type label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), this.x, by + this.height / 2 + 3);
        // Weak points
        for (const wp of this.weakPoints) {
            const wpx = this.x + wp.ox, wpy = this.y + wp.oy;
            if (wp.active && wp.cooldown <= 0) {
                const pulse = 0.6 + Math.sin(Date.now() / 120) * 0.4;
                ctx.fillStyle = `rgba(255,255,100,${pulse})`;
                ctx.shadowColor = '#ffff44';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(wpx, wpy, wp.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                if (this.easyMode) {
                    const bob = Math.sin(Date.now() / 200) * 4;
                    ctx.fillStyle = '#ffff44';
                    ctx.font = 'bold 16px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText('\u2193', wpx, wpy - wp.r - 6 + bob);
                }
            } else {
                ctx.fillStyle = 'rgba(100,100,100,0.4)';
                ctx.beginPath();
                ctx.arc(wpx, wpy, wp.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // HP bar
        const barW = 200, barH = 6, barX = (W - barW) / 2, barY = 12;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(barX, barY, barW, barH);
        const frac = this.hp / this.maxHp;
        const hpColor = frac > 0.5 ? '#44ff88' : (frac > 0.25 ? '#ffcc44' : '#ff4466');
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * frac, barH);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        // Projectiles (with telegraph during warn phase)
        for (const p of this.projectiles) {
            if (p.warn > 0) {
                const pulse = 0.5 + 0.5 * Math.sin(p.warn * 0.6);
                ctx.fillStyle = `rgba(255,68,102,${0.25 + 0.35 * pulse})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + 4 + pulse * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffcc33';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
                ctx.stroke();
                continue;
            }
            ctx.fillStyle = '#ff4466';
            ctx.shadowColor = '#ff4466';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════
// INPUT MANAGER
// ═══════════════════════════════════════════════════════════════
class InputManager {
    constructor(canvas) {
        this.keys = {};
        this.mouseX = W / 2;
        this.useMouse = false;
        this.clicked = false;
        this.pointerDown = false;
        this.released = false;
        this.konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        this.konamiIdx = 0;
        this.konamiTriggered = false;
        this.menuUp = false;
        this.menuDown = false;
        this.menuConfirm = false;

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
            if (e.key === 'ArrowUp') this.menuUp = true;
            if (e.key === 'ArrowDown') this.menuDown = true;
            if (e.key === 'Enter') this.menuConfirm = true;
            if (e.key === this.konamiSeq[this.konamiIdx]) {
                this.konamiIdx++;
                if (this.konamiIdx === this.konamiSeq.length) {
                    this.konamiIdx = 0;
                    this.konamiTriggered = true;
                }
            } else if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
                this.konamiIdx = 0;
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
        document.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const raw = (e.clientX - rect.left) * (W / rect.width);
            this.mouseX = clamp(raw, 0, W);
            this.useMouse = true;
        });
        const updateFromTouch = (touch) => {
            const rect = canvas.getBoundingClientRect();
            const raw = (touch.clientX - rect.left) * (W / rect.width);
            this.mouseX = clamp(raw, 0, W);
            this.useMouse = true;
        };
        const touchTargets = [canvas, document.getElementById('canvas-holder')].filter(Boolean);
        for (const target of touchTargets) {
            target.addEventListener('touchstart', (e) => {
                if (e.touches && e.touches[0]) updateFromTouch(e.touches[0]);
                this.clicked = true;
                this.pointerDown = true;
                e.preventDefault();
            }, { passive: false });
            target.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) updateFromTouch(e.touches[0]);
                e.preventDefault();
            }, { passive: false });
            // Release-on-up: wichtig fuer den „festhalten zum Zielen, loslassen
            // zum Schiessen"-Workflow nach Ball-Verlust.
            target.addEventListener('touchend', () => {
                if (this.pointerDown) { this.pointerDown = false; this.released = true; }
            }, { passive: true });
            target.addEventListener('touchcancel', () => {
                if (this.pointerDown) { this.pointerDown = false; this.released = true; }
            }, { passive: true });
        }
        const handleClick = () => { this.clicked = true; };
        document.addEventListener('click', handleClick);
        document.addEventListener('mousedown', () => { this.pointerDown = true; });
        document.addEventListener('mouseup', () => {
            if (this.pointerDown) { this.pointerDown = false; this.released = true; }
        });
    }

    getDir() {
        let dir = 0;
        if (this.keys['ArrowLeft'] || this.keys['a']) dir -= 1;
        if (this.keys['ArrowRight'] || this.keys['d']) dir += 1;
        return dir;
    }

    consumeClick() {
        if (this.clicked) { this.clicked = false; return true; }
        return false;
    }

    consumeRelease() {
        if (this.released) { this.released = false; return true; }
        return false;
    }

    consumeKonami() {
        if (this.konamiTriggered) { this.konamiTriggered = false; return true; }
        return false;
    }

    consumeMenuUp() { if (this.menuUp) { this.menuUp = false; return true; } return false; }
    consumeMenuDown() { if (this.menuDown) { this.menuDown = false; return true; } return false; }
    consumeMenuConfirm() { if (this.menuConfirm) { this.menuConfirm = false; return true; } return false; }

    wantsStart() {
        return this.keys[' '] || this.keys['Enter'] || this.consumeClick();
    }

    wantsPause() {
        const p = this.keys['p'] || this.keys['P'] || this.keys['Escape'];
        if (p) { this.keys['p'] = false; this.keys['P'] = false; this.keys['Escape'] = false; }
        return p;
    }

    wantsRelease() {
        return this.keys[' '] || this.consumeClick();
    }

    // Gesture fuer manuellen Start-Kleber: Finger halten -> Paddle bewegen,
    // Finger loslassen -> Ball schiesst. Leertaste funktioniert weiterhin sofort.
    wantsReleaseUp() {
        return this.keys[' '] || this.consumeRelease();
    }
}

// ═══════════════════════════════════════════════════════════════
// GAME - Master controller
// ═══════════════════════════════════════════════════════════════
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioEngine();
        // Hintergrundmusik: gleicher Shared MusicManager wie "Zaehlen"/"Buchstaben".
        // Laedt echte MP3-Tracks aus background music/. Die prozedurale
        // Music-Engine (fruehere AudioEngine) ist entfallen.
        this.music = new MusicManager(SHARED_MUSIC_TRACKS, SHARED_MUSIC_COVERS);
        // Anfangslautstaerke des MusicManagers respektiert den in localStorage
        // persistierten Breakout-Wert (Legacy), falls vorhanden. Sonst laeuft der
        // MusicManager mit seinem eigenen Default (s. shared.js).
        try {
            const legacyVol = parseFloat(localStorage.getItem('breakout_musicVolume'));
            if (!Number.isNaN(legacyVol) && legacyVol >= 0 && legacyVol <= 1) {
                this.music.setVolume(legacyVol);
            }
        } catch(_) {}
        this.particles = new ParticleSystem();
        this.vfx = new VisualEffects();
        this.paddle = new Paddle();
        this.powerups = new PowerUpManager();
        this.levels = new LevelManager();
        this.input = new InputManager(this.canvas);

        this.state = 'init';
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.partyMode = false;
        this.partyTimer = 0;
        this.bricks = [];
        this.balls = [];
        this.bricksDestroyed = 0;
        this.nextExtraLife = 5000;
        this.currentWorld = 0;
        this.boss = null;
        try { this.highScore = parseInt(localStorage.getItem('breakout_highscore') || '0'); } catch(e) { this.highScore = 0; }
        this.levelTransitionTimer = 0;
        this.newHighScoreFlag = false;
        this.bossesDefeated = 0;
        this.maxComboEver = 0;
        // Mode: 'kids' | 'normal' | 'parent'. Legacy flag breakout_kidsMode still honored.
        let storedMode = null;
        try { storedMode = localStorage.getItem('breakout_mode'); } catch(e) {}
        if (storedMode === 'kids' || storedMode === 'normal' || storedMode === 'parent') {
            this.mode = storedMode;
        } else {
            let legacyKids = true;
            try { legacyKids = localStorage.getItem('breakout_kidsMode') !== 'false'; } catch(e) {}
            this.mode = legacyKids ? 'kids' : 'normal';
        }
        this.kidsMode = this.mode === 'kids';
        this.parentMode = this.mode === 'parent';
        this.startLevel = 0;
        // Seen power-ups for intro tooltip
        try { this.seenPowerups = JSON.parse(localStorage.getItem('breakout_seenPowerups') || '{}'); } catch(e) { this.seenPowerups = {}; }
        // Sound settings
        try { this.musicMuted = localStorage.getItem('breakout_musicMuted') === 'true'; } catch(e) { this.musicMuted = false; }
        try { this.sfxMuted = localStorage.getItem('breakout_sfxMuted') === 'true'; } catch(e) { this.sfxMuted = false; }
        // Skins
        try { this.unlockedSkins = JSON.parse(localStorage.getItem('breakout_skins') || '["default"]'); } catch(e) { this.unlockedSkins = ['default']; }
        try { this.selectedSkin = localStorage.getItem('breakout_skin') || 'default'; } catch(e) { this.selectedSkin = 'default'; }
        this.skinMenuOpen = false;
        // Puzzle reward
        this.puzzle = new BreakoutPuzzle();

        // Beat-Callback bleibt bestehen (Attrappe, feuert nicht mehr, da die
        // prozedurale Musik entfernt wurde). Das Party-Mode-Flackern wird von
        // der VFX selbst gesteuert, ein Beat-Pulse ist nicht mehr noetig.
        this.audio.onBeatCallback = null;
        this._applySoundSettings();

        // Body-Klasse fuer Kids-Mode (blendet Score-Zahlen und Puzzle aus)
        this._applyKidsModeClass();

        // Back button: Bei laufendem Spiel Bestaetigungs-Dialog, sonst direkt.
        document.getElementById('back-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'playing' || this.state === 'paused') {
                this._showQuitConfirm();
            } else {
                this.music.stopBackgroundMusic();
                window.location.href = 'index.html';
            }
        });

        // Musik-Auswahl-Button innerhalb des Eltern-/Pause-Menues oeffnet das
        // Track-Picker-Popup (gleiche Optik wie die anderen Spiele).
        const musicPickerBtn = document.getElementById('bp-music-picker-btn');
        if (musicPickerBtn) {
            musicPickerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.music.showOverlay();
            });
        }

        // Einziger Menue-Button (oben rechts): oeffnet das kombinierte
        // Pause-+Einstellungs-Menue und pausiert dabei das Spiel.
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this._executePauseAction('resume');
                }
            });
            pauseBtn.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }

        // Weiter-Button im Panel-Footer setzt das Spiel fort.
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._executePauseAction('resume');
            });
        }
        // Klick auf Overlay-Hintergrund schliesst das Menue (=Weiter).
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            pauseOverlay.addEventListener('click', (e) => {
                if (e.target === pauseOverlay) this._executePauseAction('resume');
            });
        }
        this._initParentSettingsUI();

        // Skin selector (aus dem Eltern-Overlay heraus, nicht direkt aus Start-Screen)
        this._buildSkinGrid();
        document.getElementById('bp-skins-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            // _closeParentSettings statt nur `hidden` setzen, damit der
            // TTS-Status-Timer sauber gestoppt wird (sonst laeuft der Poller
            // im Hintergrund weiter, waehrend das Skins-Menue offen ist).
            this._closeParentSettings();
            document.getElementById('skins-overlay').classList.remove('hidden');
        });
        document.getElementById('skins-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('skins-overlay').classList.add('hidden');
            // Re-sync der Parent-Settings-UI, falls sich zwischendurch etwas
            // geaendert hat (z.B. frisch geladener Piper-Status).
            this._openParentSettings();
        });

        // Retry-Buttons auf Game-Over/Win-Overlays (fangen den Klick explizit ab,
        // damit nicht versehentlich eine Tastatur-Aktion triggert.)
        document.querySelectorAll('.retry-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startGame();
            });
        });

        // Overlays die NICHT automatisch als Spiel-Start interpretiert werden
        // duerfen: Klick auf leere Flaeche soll nichts starten. (Der Quit-
        // Dialog wird von GameUI live erzeugt und kapselt sein Input selbst.)
        ['skins-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', (e) => e.stopPropagation());
        });

        // Spiel-Aktionen im kombinierten Menue.
        document.querySelectorAll('.pause-menu-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state === 'paused') {
                    this._executePauseAction(btn.dataset.action);
                }
            });
        });

        this.updateHUD();
        // Spiel startet direkt mit am Paddle klebendem Ball. Kein Tutorial, kein
        // Spielen-Button. Erstes Drücken+Loslassen schiesst den Ball ab und
        // weckt den Audio-Context (Autoplay-Gate).
        this.startGame();
        this.loop();
    }

    _initParentSettingsUI() {
        // Verkabelt alle Eingabeelemente des Eltern-Panels (Shared-Optik wie
        // „Buchstaben"/„Zaehlen") mit dem Spielzustand. Wird einmalig beim
        // Spielstart ausgefuehrt; _openParentSettings synchronisiert dann nur
        // noch die Werte.
        const $ = (id) => document.getElementById(id);
        // Mode-Presets
        const modePresets = document.querySelectorAll('#bp-mode-presets .parent-preset');
        modePresets.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const m = btn.dataset.mode;
                if (!m) return;
                this.mode = m;
                this.kidsMode = m === 'kids';
                this.parentMode = m === 'parent';
                try {
                    localStorage.setItem('breakout_mode', this.mode);
                    localStorage.setItem('breakout_kidsMode', this.kidsMode.toString());
                } catch(_) {}
                this._applyKidsModeClass();
                this._syncParentSettingsUI();
            });
        });
        // Level-Stepper
        $('bp-level-down').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.startLevel > 0) this.startLevel--;
            this._syncParentSettingsUI();
        });
        $('bp-level-up').addEventListener('click', (e) => {
            e.stopPropagation();
            const maxLvl = this.kidsMode ? 10 : 20;
            if (this.startLevel < maxLvl - 1) this.startLevel++;
            this._syncParentSettingsUI();
        });
        // Musik-Lautstaerke: verkabelt mit dem Shared MusicManager.
        $('bp-vol-slider').addEventListener('input', (e) => {
            const pct = parseInt(e.target.value);
            this._setMusicVolumePct(pct);
            $('bp-vol-val').textContent = pct + '%';
        });
        // Musik/SFX-Toggles
        $('bp-music-toggle').addEventListener('change', (e) => {
            const on = e.target.checked;
            this.musicMuted = !on;
            try { localStorage.setItem('breakout_musicMuted', this.musicMuted.toString()); } catch(_) {}
            // Slider auf 0? Dann beim Einschalten wieder auf eine hoerbare
            // Default-Lautstaerke setzen, damit der Toggle spuerbar wirkt.
            if (on && this.music && this.music.volume <= 0.001) {
                this._setMusicVolumePct(13);
                if ($('bp-vol-slider')) $('bp-vol-slider').value = 13;
                if ($('bp-vol-val')) $('bp-vol-val').textContent = '13%';
                this.musicMuted = false;
            }
            // _applySoundSettings synchronisiert MusicManager.musicEnabled mit
            // this.musicMuted; nicht doppelt toggeln.
            this._applySoundSettings();
        });
        $('bp-sfx-toggle').addEventListener('change', (e) => {
            this.sfxMuted = !e.target.checked;
            try { localStorage.setItem('breakout_sfxMuted', this.sfxMuted.toString()); } catch(_) {}
            // Laufende TTS/SpeechSynthesis sofort abbrechen, damit das Kind
            // nicht verwirrt ist, wenn der Effekte-Toggle scheinbar nichts tut.
            if (this.sfxMuted) this._cancelSpeech();
            this._applySoundSettings();
        });
        // TTS-Backend-Auswahl: Thorsten (Piper) vs. Standard (Browser).
        document.querySelectorAll('input[name="bp-voice"]').forEach(r => {
            r.addEventListener('change', () => {
                const tts = this._tts();
                if (tts) tts.setBackend(r.value);
                this._renderTtsStatus();
            });
        });
    }

    _tts() {
        // PiperTTSManager wird von shared.js als klassisches Script im globalen
        // Script-Scope deklariert (nicht auf window.*). Die Shared-Instanz sorgt
        // dafuer, dass alle Spiele dasselbe Modell und dieselben Einstellungen
        // (Backend-Auswahl, Google-Key, …) verwenden.
        if (typeof PiperTTSManager === 'undefined') return null;
        if (!this._ttsInstance) {
            try { this._ttsInstance = PiperTTSManager.getShared('de_DE-thorsten-medium'); }
            catch(e) { this._ttsInstance = null; }
        }
        return this._ttsInstance;
    }

    _openParentSettings() {
        this._syncParentSettingsUI();
        document.getElementById('pause-overlay').classList.remove('hidden');
        if (this._ttsStatusTimer) clearInterval(this._ttsStatusTimer);
        this._ttsStatusTimer = setInterval(() => this._renderTtsStatus(), 500);
    }

    _closeParentSettings() {
        document.getElementById('pause-overlay').classList.add('hidden');
        if (this._ttsStatusTimer) { clearInterval(this._ttsStatusTimer); this._ttsStatusTimer = null; }
    }

    _syncParentSettingsUI() {
        const $ = (id) => document.getElementById(id);
        // Modus
        document.querySelectorAll('#bp-mode-presets .parent-preset').forEach(b => {
            b.classList.toggle('active', b.dataset.mode === this.mode);
        });
        const modeHint = $('bp-mode-hint');
        if (modeHint) {
            const hints = {
                kids: 'Kinder: langsamer, vorlesender Modus. Empfohlen für 3–4 Jahre.',
                normal: 'Normal: klassischer Breakout-Schwierigkeitsverlauf.',
                parent: 'Eltern-Test: zusätzlicher „Level überspringen"-Button im Pause-Menü.'
            };
            modeHint.textContent = hints[this.mode] || '';
        }
        // Level
        const maxLvl = this.kidsMode ? 10 : 20;
        if (this.startLevel >= maxLvl) this.startLevel = maxLvl - 1;
        if (this.startLevel < 0) this.startLevel = 0;
        const levelNum = (this.startLevel + 1).toString();
        if ($('bp-level-val')) $('bp-level-val').textContent = levelNum;
        if ($('bp-level-display')) $('bp-level-display').textContent = levelNum;
        // Lautstaerke
        const pct = Math.round((this._getMusicVolumePct ? this._getMusicVolumePct() : 13));
        if ($('bp-vol-slider')) $('bp-vol-slider').value = pct;
        if ($('bp-vol-val')) $('bp-vol-val').textContent = pct + '%';
        // Mute-Toggles
        if ($('bp-music-toggle')) $('bp-music-toggle').checked = !this.musicMuted;
        if ($('bp-sfx-toggle')) $('bp-sfx-toggle').checked = !this.sfxMuted;
        // Stimme: in breakout nur Thorsten (Piper) oder Standard (Browser)
        // waehlbar. Falls ein anderes Spiel 'google' eingestellt hat, fallen wir
        // in der Anzeige auf Piper zurueck; das google-Backend bleibt aber
        // funktional, falls dort konfiguriert.
        const tts = this._tts();
        if (tts) {
            const backend = tts.backend || 'piper';
            const uiBackend = (backend === 'browser') ? 'browser' : 'piper';
            document.querySelectorAll('input[name="bp-voice"]').forEach(r => {
                r.checked = (r.value === uiBackend);
            });
        }
        this._renderTtsStatus();
    }

    _renderTtsStatus() {
        const el = document.getElementById('bp-tts-status');
        if (!el) return;
        el.classList.remove('ready', 'fallback');
        const tts = this._tts();
        if (!tts) { el.textContent = '○ Stimm-Modul laedt …'; return; }
        const backend = tts.backend || 'piper';
        if (backend === 'browser') {
            el.textContent = '● Browser-Stimme aktiv';
            el.classList.add('ready');
            return;
        }
        if (backend === 'google') {
            const gs = tts.googleStatus;
            if (!tts.googleKey) { el.textContent = '○ Kein API-Key eingetragen'; el.classList.add('fallback'); return; }
            if (gs === 'ready') { el.textContent = '● Google-Stimme bereit'; el.classList.add('ready'); return; }
            if (gs === 'error') { el.textContent = '○ API-Fehler – Browser-Fallback aktiv'; el.classList.add('fallback'); return; }
            el.textContent = '○ Noch nicht getestet';
            return;
        }
        const s = tts.status;
        if (s === 'ready') { el.textContent = '● Piper/Thorsten bereit'; el.classList.add('ready'); }
        else if (s === 'downloading') el.textContent = `⬇ Modell lädt … ${Math.round((tts.progress || 0) * 100)}%`;
        else if (s === 'fallback') { el.textContent = '○ Nicht verfügbar – Browser-Stimme aktiv'; el.classList.add('fallback'); }
        else el.textContent = '○ Initialisiert …';
    }

    _getMusicVolumePct() {
        // Volume kommt jetzt aus dem Shared MusicManager.
        if (!this.music) return 0;
        const v = this.musicMuted ? 0 : (this.music.volume ?? 0.25);
        return Math.round(v * 100);
    }

    _setMusicVolumePct(pct) {
        pct = Math.max(0, Math.min(100, pct));
        const val = pct / 100;
        if (this.music) {
            this.music.setVolume(val);
        }
        this.musicMuted = (val <= 0.001);
        try {
            localStorage.setItem('breakout_musicVolume', String(val));
            localStorage.setItem('breakout_musicMuted', this.musicMuted.toString());
        } catch(_) {}
    }

    _applyKidsModeClass() {
        document.body.classList.toggle('kids-mode', !!this.kidsMode);
        document.body.classList.toggle('parent-mode-test', !!this.parentMode);
    }

    _applySoundSettings() {
        if (this.audio.sfxGain) this.audio.sfxGain.gain.value = this.sfxMuted ? 0 : 0.5;
        // Musik-Mute ueber den Shared MusicManager. Nur umschalten, wenn der
        // Zustand wirklich abweicht (sonst Double-Toggle).
        if (this.music && this.music.musicEnabled === this.musicMuted) {
            this.music.toggleMusic();
        }
    }

    _cancelSpeech() {
        // Bricht sowohl die Piper-basierte als auch die SpeechSynthesis-Variante
        // ab - wichtig, wenn der Effekte-Toggle waehrend einer laufenden
        // Ansage ausgeschaltet wird.
        try {
            const tts = this._ttsInstance;
            if (tts && typeof tts._stop === 'function') tts._stop();
        } catch(_) {}
        try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(_) {}
    }

    _speak(text) {
        // Sprachausgabe fuer 3-4jaehrige Kinder (Nichtleser). Best-effort: wenn
        // PiperTTSManager geladen ist (shared.js), nutzen wir die Thorsten-Stimme
        // wie in „Buchstaben"/„Zaehlen". Fallback auf die Browser-Stimme ist
        // bereits in PiperTTSManager eingebaut.
        if (!this.kidsMode || this.sfxMuted) return;
        const tts = this._tts();
        if (tts && typeof tts.speak === 'function') {
            try { tts.speak(text); } catch (e) {}
            return;
        }
        try {
            const ss = window.speechSynthesis;
            if (!ss) return;
            ss.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'de-DE';
            u.rate = 0.95;
            u.pitch = 1.15;
            u.volume = 1.0;
            ss.speak(u);
        } catch (e) {}
    }

    _speakPowerup(type) {
        const text = POWERUP_SPEECH_DE[type];
        if (text) this._speak(text);
    }

    _numberWord(n) {
        const words = ['null','eins','zwei','drei','vier','f\u00fcnf','sechs','sieben','acht','neun','zehn','elf','zw\u00f6lf','dreizehn','vierzehn','f\u00fcnfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'];
        return words[n] || String(n);
    }

    _showQuitConfirm() {
        // Vereinheitlicht ueber GameUI: identischer Dialog wie in Zaehl-/
        // Buchstabenspiel. Waehrend der Bestaetigung wird das Pause-Menue
        // weggeblendet; bei Abbruch stellen wir den vorherigen Zustand wieder
        // her (laufendes Spiel oder sichtbares Pause-Menue).
        if (GameUI.isQuitConfirmOpen()) return;

        const prevState = this.state;
        const pauseOverlay = document.getElementById('pause-overlay');
        if (prevState === 'playing') {
            this.pauseGame();
        }
        if (pauseOverlay) pauseOverlay.classList.add('hidden');
        this._quitConfirmPrevState = prevState;

        GameUI.showQuitConfirm({
            tts: this.sfxMuted ? null : this._tts(),
            onQuit: () => {
                this._quitConfirmPrevState = null;
                this.music.stopBackgroundMusic();
                window.location.href = 'index.html';
            },
            onCancel: () => {
                const prev = this._quitConfirmPrevState;
                this._quitConfirmPrevState = null;
                if (prev === 'playing') {
                    this._executePauseAction('resume');
                } else if (prev === 'paused' && pauseOverlay) {
                    pauseOverlay.classList.remove('hidden');
                }
            }
        });
    }

    _armAudioUnlock() {
        if (this._audioUnlockArmed) return;
        this._audioUnlockArmed = true;
        const unlock = () => {
            document.removeEventListener('pointerdown', unlock, true);
            document.removeEventListener('keydown', unlock, true);
            try {
                if (this.audio.ctx && this.audio.ctx.state === 'suspended') {
                    this.audio.ctx.resume().catch(() => {});
                }
            } catch(_) {}
            // Autoplay-Policy: Browser blockieren Audio bis zur ersten User-Geste.
            // Beim ersten Pointerdown/Keydown holen wir das Starten der MP3s nach.
            if (this.state === 'playing' && this.music && this.music.musicEnabled) {
                try { this.music.playBackgroundMusic(); } catch(_) {}
            }
        };
        document.addEventListener('pointerdown', unlock, true);
        document.addEventListener('keydown', unlock, true);
    }

    _showPowerupIntro(type) {
        if (this.seenPowerups[type]) return;
        this.seenPowerups[type] = true;
        try { localStorage.setItem('breakout_seenPowerups', JSON.stringify(this.seenPowerups)); } catch(e) {}
        const name = POWERUP_NAMES_DE[type] || type.toUpperCase();
        const hint = POWERUP_HINTS_DE[type] || '';
        this.vfx.addFloatingText(W / 2, H / 2 - 40, name + '!', POWERUP_COLORS[type]);
        if (hint) this.vfx.addFloatingText(W / 2, H / 2 - 15, hint, '#e0e0ff');
    }

    startGame() {
        this.audio.init();
        // _applySoundSettings synchronisiert MusicManager.musicEnabled mit musicMuted.
        this._applySoundSettings();
        // Browser blockieren Autoplay bis zur ersten Nutzer-Geste. Da das Spiel
        // direkt laeuft (ohne Play-Button), beim ersten Pointerdown/Keydown den
        // Audio-Context entsperren und die Musik ggf. nachstarten.
        this._armAudioUnlock();
        // Etwaige vorherige Klicks verwerfen, damit der geklebte Ball nicht sofort fliegt.
        this.input.consumeClick();
        this.input.consumeRelease();
        this.state = 'playing';
        this.score = 0;
        this.lives = this.kidsMode ? 5 : 3;
        this.combo = 0;
        this.bricksDestroyed = 0;
        this.nextExtraLife = 5000;
        this.partyMode = false;
        this.partyTimer = 0;
        this.newHighScoreFlag = false;
        this.boss = null;
        this.maxComboEver = 0;
        this.bossesDefeated = 0;
        document.body.classList.remove('party-mode');
        this._applyKidsModeClass();
        this.levels.currentLevel = this.startLevel;
        this.powerups.reset();
        this.paddle = new Paddle();
        if (this.kidsMode) this.paddle.setWidth(120);
        this.loadLevel(this.startLevel);
        // Hintergrundmusik: Versuch startet sofort, wird aber vom Browser erst
        // nach der ersten Nutzer-Geste hoerbar (siehe _armAudioUnlock).
        if (this.music && this.music.musicEnabled) {
            try { this.music.playBackgroundMusic(); } catch(_) {}
        }
        this.hideAllOverlays();
        this.updateHUD();
        if (this.kidsMode) {
            const lvl = this.startLevel + 1;
            this._speak('Los geht\u2019s! Level ' + this._numberWord(lvl) + '!');
        }
    }

    loadLevel(idx) {
        this.levels.currentLevel = idx;
        this.currentWorld = getWorldForLevel(idx);
        this.bricksDestroyed = 0;
        this.boss = null;
        // Kids-Mode: Keine Boss-Level. 3-4jaehrige Kinder koennen Paddle-Steuerung
        // nicht mit Projektil-Ausweichen kombinieren - das ueberfordert die
        // Motorik und ist frustrierend. Normal-Mode: Boss alle 5 Level.
        if (!this.kidsMode && idx > 0 && (idx + 1) % 5 === 0) {
            this.boss = new Boss(idx, this.currentWorld, this.kidsMode);
            this.bricks = [];
        } else {
            this.bricks = this.levels.getBricks(idx, this.kidsMode);
        }
        this.resetBalls();
    }

    resetBalls() {
        const baseSpeed = this.levels.getBaseSpeed();
        const speed = this.kidsMode ? baseSpeed * 0.6 : baseSpeed;
        // Ball klebt am Paddle bis der Spieler tippt. So kann das Kind
        // selbst entscheiden, von wo aus der Ball startet.
        const startX = this.paddle ? this.paddle.x + this.paddle.w / 2 : W / 2;
        const startY = this.paddle ? this.paddle.y - 8 : H - 50;
        const ball = new Ball(startX, startY, 0, 0, speed);
        ball.stuck = true;
        ball.manualStick = true;
        ball.stuckOffset = 0;
        this.balls = [ball];
        // Etwaige vorherige Klicks verwerfen, damit der Ball nicht sofort fliegt.
        if (this.input) this.input.consumeClick();
    }

    _updatePauseBtnVisibility() {
        const btn = document.getElementById('pause-btn');
        if (!btn) return;
        const visible = this.state === 'playing' || this.state === 'leveltransition' || this.state === 'paused';
        btn.classList.toggle('hidden', !visible);
    }

    // --- Main loop ---
    loop() {
        this.update();
        this._updatePauseBtnVisibility();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.state === 'gameover' || this.state === 'win') {
            if (!document.getElementById('skins-overlay').classList.contains('hidden')) return;
            if (!document.getElementById('pause-overlay').classList.contains('hidden')) return;
            if (this.input.wantsStart()) this.startGame();
            return;
        }

        if (this.state === 'paused') {
            this._updatePauseMenu();
            return;
        }

        if (this.state === 'leveltransition') {
            this.levelTransitionTimer--;
            this.particles.update();
            this.vfx.update(this.combo, this.partyMode);
            if (this.levelTransitionTimer <= 0) {
                const nextLvl = this.levels.currentLevel + 1;
                const maxLvl = this.kidsMode ? 10 : 20;
                document.getElementById('level-overlay').classList.add('hidden');
                if (nextLvl >= maxLvl) {
                    this.winGame();
                    return;
                }
                this.state = 'playing';
                this.loadLevel(nextLvl);
                // MP3 laeuft weiter bzw. wird wieder aufgenommen; nichts neu zu starten.
                if (this.music && this.music.musicEnabled && this.music.backgroundMusic && this.music.backgroundMusic.paused) {
                    try { this.music.backgroundMusic.play().catch(()=>{}); } catch(_) {}
                }
                this.updateHUD();
            }
            return;
        }

        if (this.input.wantsPause()) {
            this.pauseGame();
            return;
        }

        // Konami check
        if (this.input.consumeKonami()) {
            this.activatePartyMode(1800);
        }

        const speedMult = this.powerups.getSpeedMult();

        // Paddle
        this.paddle.update(this.input.getDir(), this.input.mouseX, this.input.useMouse);

        // Stuck-Handling: Magnet-Power-up ODER manueller Start-Kleber nach Ball-Verlust.
        // manualStick-Baelle loesen sich erst beim Loslassen des Fingers
        // (wantsReleaseUp), damit der Spieler erst das Paddle hinziehen und
        // dann zielgenau abfeuern kann. Magnet loest wie bisher auf Tap.
        const anyManualStick = this.balls.some(b => b.stuck && b.manualStick);
        const manualReleaseRequested = anyManualStick ? this.input.wantsReleaseUp() : false;
        const magnetReleaseRequested = (!anyManualStick && this.balls.some(b => b.stuck && !b.manualStick))
            ? this.input.wantsRelease() : false;
        for (const ball of this.balls) {
            if (!ball.stuck) { ball.stickTime = 0; continue; }
            ball.x = this.paddle.x + this.paddle.w / 2 + (ball.stuckOffset || 0);
            ball.y = this.paddle.y - ball.r;
            ball.stickTime = (ball.stickTime || 0) + 1;
            // Kurze Schonfrist, damit ein noch nicht konsumierter Klick (z.B. vom
            // "Spielen"-Button) den Ball nicht sofort abfeuert.
            if (ball.stickTime <= 8) {
                this.input.consumeClick();
                this.input.consumeRelease();
                continue;
            }
            // Magnet: Auto-Release nach 8s. Manueller Start: Tipp erforderlich.
            const autoRelease = !ball.manualStick && ball.stickTime > 480;
            const released = ball.manualStick ? manualReleaseRequested : magnetReleaseRequested;
            if (released || autoRelease) {
                ball.stuck = false;
                ball.manualStick = false;
                ball.stickTime = 0;
                const hitPos = (ball.x - this.paddle.x) / this.paddle.w;
                const angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
                ball.setAngle(angle, ball.speed);
            }
        }

        // Boss update
        if (this.boss && !this.boss.defeated) {
            this.boss.update();
            // Boss projectile hits paddle
            if (this.boss.checkProjectileHitPaddle(this.paddle)) {
                this.lives--;
                this.audio.sfx('loseLife');
                this.vfx.triggerShake(8);
                this.vfx.flash('#ff0000', 0.4);
                this.updateHUD();
                if (this.lives <= 0) { this.gameOver(); return; }
            }
        }

        // Balls
        for (const ball of this.balls) {
            ball.update(speedMult);

            // Boss collision
            if (this.boss && !this.boss.defeated && !ball.stuck) {
                if (this.boss.checkBallHit(ball)) {
                    this.audio.sfx('brickHit', 0);
                    this.score += 100;
                    this.combo++;
                    this.particles.spawn(ball.x, ball.y, '#ffff44', 6, { speed: 3, speedVar: 2 });
                    this.vfx.triggerShake(3);
                    this.updateHUD();
                    if (this.boss.defeated) {
                        this.onBossDefeated();
                    }
                }
            }

            // Wall collisions
            if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.dx = Math.abs(ball.dx); this.audio.sfx('wallHit', 'side'); }
            if (ball.x + ball.r >= W) { ball.x = W - ball.r; ball.dx = -Math.abs(ball.dx); this.audio.sfx('wallHit', 'side'); }
            if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.dy = Math.abs(ball.dy); this.audio.sfx('wallHit', 'top'); }

            // Shield check
            if (ball.y + ball.r >= H - 13 && ball.dy > 0 && this.powerups.checkShield(ball.y + ball.r)) {
                ball.dy = -Math.abs(ball.dy);
                this.audio.sfx('shield');
                this.particles.spawn(ball.x, H - 10, '#4488ff', 8, { speed: 2, speedVar: 2 });
            }

            // Ball falls below
            if (ball.y + ball.r > H + 10) {
                ball.alive = false;
            }

            // Paddle collision
            if (!ball.stuck && ball.dy > 0 &&
                ball.y + ball.r >= this.paddle.y && ball.y + ball.r <= this.paddle.y + this.paddle.h + 6 &&
                ball.x >= this.paddle.x && ball.x <= this.paddle.x + this.paddle.w) {
                if (this.powerups.isActive('magnet') && !ball.stuck) {
                    ball.stuck = true;
                    ball.stuckOffset = ball.x - (this.paddle.x + this.paddle.w / 2);
                    ball.dx = 0; ball.dy = 0;
                } else {
                    const hitPos = (ball.x - this.paddle.x) / this.paddle.w;
                    const angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
                    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    ball.dx = Math.cos(angle) * currentSpeed;
                    ball.dy = Math.sin(angle) * currentSpeed;
                    ball.y = this.paddle.y - ball.r;
                }
                ball.stuckTimer = 0; // reset stuck detection
                this.audio.sfx('paddleHit');
                this.particles.spawn(ball.x, ball.y, WORLD_THEMES[this.currentWorld].particleColor, 4);
            }

            // Brick collision
            if (!ball.stuck) this.checkBrickCollisions(ball);
        }

        this.balls = this.balls.filter(b => b.alive);
        if (this.balls.length === 0) {
            this.lives--;
            this.combo = 0;
            if (this.partyMode) this.deactivatePartyMode();
            if (this.kidsMode) {
                this.audio.sfx('encourage');
                this.vfx.triggerShake(4);
                this.vfx.flash('#4488ff', 0.2);
                if (this.lives > 0) {
                    this.vfx.addFloatingText(W / 2, H / 2, '👆 ZIEHEN, LOSLASSEN!', '#44bbff');
                    this._speak('Ziehen, loslassen!');
                }
            } else {
                this.audio.sfx('loseLife');
                this.vfx.triggerShake(8);
                this.vfx.flash('#ff0000', 0.4);
            }
            this.updateHUD();
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBalls();
            }
        }

        // Laser vs bricks and boss
        for (let i = this.paddle.lasers.length - 1; i >= 0; i--) {
            const laser = this.paddle.lasers[i];
            let hit = false;
            // Laser vs boss
            if (this.boss && !this.boss.defeated) {
                for (const wp of this.boss.weakPoints) {
                    if (!wp.active || wp.cooldown > 0) continue;
                    const wpx = this.boss.x + wp.ox, wpy = this.boss.y + wp.oy;
                    if (Math.abs(laser.x - wpx) < wp.r && Math.abs(laser.y - wpy) < wp.r) {
                        this.boss.hp -= 1;
                        wp.cooldown = 15;
                        this.boss.flashTimer = 8;
                        this.score += 50;
                        this.combo++;
                        this.particles.spawn(wpx, wpy, '#ffff44', 4);
                        this.updateHUD();
                        if (this.boss.hp <= 0) { this.boss.hp = 0; this.boss.defeated = true; this.onBossDefeated(); }
                        hit = true;
                        break;
                    }
                }
            }
            // Laser vs bricks
            if (!hit) {
                for (const brick of this.bricks) {
                    if (!brick.alive) continue;
                    if (laser.x >= brick.x && laser.x <= brick.x + brick.w &&
                        laser.y >= brick.y && laser.y <= brick.y + brick.h) {
                        this.destroyBrick(brick);
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) this.paddle.lasers.splice(i, 1);
        }

        // Bricks update (moving + descending)
        for (const brick of this.bricks) {
            brick.update();
            // Descending bricks that reach paddle zone: destroy them and lose a life
            if (brick.alive && brick.descending && brick.y + brick.h >= this.paddle.y) {
                brick.alive = false;
                this.particles.spawnShatter(brick.x, brick.y, brick.w, brick.h, '#ff4466', 8);
                this.vfx.triggerShake(6);
                this.vfx.flash('#ff0000', 0.3);
                this.audio.sfx('loseLife');
                this.lives--;
                this.updateHUD();
                if (this.lives <= 0) { this.gameOver(); return; }
            }
        }

        const collected = this.powerups.update(this.paddle);
        for (const type of collected) {
            this.audio.sfx('powerup');
            this._showPowerupIntro(type);
            this._speakPowerup(type);
            this.applyPowerup(type);
        }

        // Power-up combo check
        const newCombo = this.powerups.checkCombos(this.balls.length);
        if (newCombo) {
            this.audio.sfx('partyActivate');
            this.vfx.addFloatingText(W / 2, H / 2 - 30, newCombo.name + '!', newCombo.color);
            this.vfx.flash(newCombo.color, 0.4);
            this.vfx.triggerShake(6);
            this.applyComboEffect(newCombo.id);
        }
        // Ongoing combo effects
        if (this.powerups.activeCombo) {
            this.updateComboEffect(this.powerups.activeCombo.id);
        }

        // Powerup effects expiry - restore paddle width
        if (!this.powerups.isActive('giant') && !this.powerups.isActive('tiny') && !this.partyMode) {
            if (this.paddle.w !== this.paddle.baseW) this.paddle.setWidth(this.paddle.baseW);
        }
        if (!this.powerups.isActive('fireball') && !this.partyMode) {
            for (const ball of this.balls) ball.fireball = false;
        }
        if (!this.powerups.isActive('magnet')) {
            this.paddle.magnetActive = false;
            for (const ball of this.balls) {
                // manualStick-Kleber bleibt erhalten, der Spieler startet per Tipp.
                if (ball.stuck && !ball.manualStick) {
                    ball.stuck = false;
                    ball.setAngle(-Math.PI / 2 + (Math.random() - 0.5) * 0.6, ball.speed);
                }
            }
        }

        // Party mode timer
        if (this.partyMode) {
            this.partyTimer--;
            if (this.partyTimer <= 0) this.deactivatePartyMode();
        }

        // Check level complete (not during boss fights)
        if (!this.boss && this.levels.isLevelComplete(this.bricks)) {
            this.levelComplete();
        }

        // Extra life
        if (this.score >= this.nextExtraLife && this.lives < 5) {
            this.lives++;
            this.nextExtraLife += 5000;
            this.audio.sfx('extraLife');
            this.vfx.addFloatingText(W / 2, H / 2, '+1 UP!', '#44ff88');
            this.vfx.flash('#44ff88', 0.3);
            this._speak('Ein Leben mehr!');
            this.updateHUD();
        }

        this.particles.update();
        this.vfx.update(this.combo, this.partyMode);
        // Musik-Tempo-Modulation absichtlich entfernt: playbackRate auf MP3s mit
        // WebAudio-Routing konnte zum Crash fuehren (siehe Commit 8929fd9).
    }

    checkBrickCollisions(ball) {
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            if (ball.x + ball.r > brick.x && ball.x - ball.r < brick.x + brick.w &&
                ball.y + ball.r > brick.y && ball.y - ball.r < brick.y + brick.h) {

                const isBomb = ball.bomb;
                const isFireball = ball.fireball;

                // Bounce (unless fireball and not steel)
                if (!isFireball || brick.type === 'steel') {
                    const overlapLeft = ball.x + ball.r - brick.x;
                    const overlapRight = brick.x + brick.w - (ball.x - ball.r);
                    const overlapTop = ball.y + ball.r - brick.y;
                    const overlapBottom = brick.y + brick.h - (ball.y - ball.r);
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) ball.dx = -ball.dx;
                    else ball.dy = -ball.dy;
                }

                if (brick.type === 'steel') {
                    this.audio.sfx('steel');
                    this.vfx.triggerShake(1);
                    brick.hitFlash = 6;
                    // Add slight random deflection to prevent infinite loops in steel corridors
                    ball.dx += (Math.random() - 0.5) * 0.4;
                    ball.dy += (Math.random() - 0.5) * 0.2;
                    break;
                }

                // Bomb: destroy 3x3 area
                if (isBomb) {
                    ball.bomb = false;
                    const neighbors = this.levels.getNeighbors(this.bricks, brick);
                    for (const n of neighbors) this.destroyBrick(n);
                    this.destroyBrick(brick);
                    this.audio.sfx('explosion');
                    this.vfx.triggerShake(10);
                    this.vfx.flash('#ff8844', 0.6);
                    break;
                }

                // Explosive brick
                if (brick.type === 'explosive') {
                    this.chainExplosion(brick, 0);
                    break;
                }

                // Normal hit
                const destroyed = brick.hit();
                if (destroyed) {
                    this.onBrickDestroyed(brick, ball);
                } else {
                    this.audio.sfx('brickHit', brick.row);
                    this.combo++;
                }

                if (!isFireball) break;
            }
        }
    }

    chainExplosion(brick, depth) {
        if (depth > 3 || !brick.alive) return;
        brick.alive = false;
        this.onBrickDestroyed(brick, null, true);
        this.audio.sfx('explosion');
        this.vfx.triggerShake(6 + depth * 2);
        this.vfx.flash('#ff6622', 0.4);
        this.particles.spawn(brick.x + brick.w / 2, brick.y + brick.h / 2, '#ff6622', 15, {
            speed: 3, speedVar: 3, size: 3, sizeVar: 4
        });
        const neighbors = this.levels.getNeighbors(this.bricks, brick);
        for (const n of neighbors) {
            if (n.type === 'explosive') {
                setTimeout(() => this.chainExplosion(n, depth + 1), 50);
            } else {
                n.alive = false;
                this.onBrickDestroyed(n, null, false);
            }
        }
    }

    destroyBrick(brick) {
        if (!brick.alive || brick.type === 'steel') return;
        brick.alive = false;
        this.onBrickDestroyed(brick, null, brick.type === 'explosive');
        if (brick.type === 'explosive') {
            this.chainExplosion(brick, 0);
        }
    }

    onBrickDestroyed(brick, ball, isExplosion = false) {
        this.bricksDestroyed++;
        this.combo++;
        // Score
        const comboMult = Math.floor(this.combo / 5) + 1;
        const powerupMult = this.powerups.getScoreMult();
        let points;
        if (brick.type === 'gold') {
            points = 500 * comboMult * powerupMult;
            this.audio.sfx('gold');
        } else {
            points = (BRICK_ROWS - brick.row) * 10 * comboMult * powerupMult;
        }
        if (isExplosion) points += 100 * comboMult;
        this.score += Math.round(points);
        if (this.combo > this.maxComboEver) this.maxComboEver = this.combo;
        // Check high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try { localStorage.setItem('breakout_highscore', this.highScore.toString()); } catch(e) {}
            if (!this.newHighScoreFlag) {
                this.newHighScoreFlag = true;
                this.vfx.addFloatingText(W / 2, H / 3, 'NEW HIGH SCORE!', '#ffcc44');
            }
            this.checkSkinUnlocks();
        }
        this.updateHUD();
        // Audio
        if (!isExplosion) this.audio.sfx('brickHit', brick.row);
        // VFX
        this.particles.spawnShatter(brick.x, brick.y, brick.w, brick.h, brick.getColor(false, this.currentWorld), 6);
        this.particles.spawn(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.getColor(false, this.currentWorld), 6);
        this.vfx.flash('#fff', 0.08);
        this.vfx.triggerShake(2);
        // Lightning at high combo
        if (this.combo >= 10 && ball) {
            this.vfx.addLightning(ball.x, ball.y, brick.x + brick.w / 2, brick.y + brick.h / 2);
        }
        // Combo milestones
        if (this.combo > 0 && this.combo % 10 === 0) {
            this.vfx.triggerZoom();
            this.vfx.addFloatingText(W / 2, H / 2, this.combo + 'x COMBO!', '#ffcc44');
        }
        // Party mode trigger at 20
        if (this.combo === 20 && !this.partyMode) {
            this.activatePartyMode(600);
        }
        // Powerup drop
        this.powerups.trySpawn(brick.x + brick.w / 2, brick.y + brick.h / 2, this.partyMode, this.kidsMode);
        // Ball speed increase every 5 bricks
        if (this.bricksDestroyed % 5 === 0) {
            const speedMul = this.kidsMode ? 0.6 : 1;
            const maxSpeed = (this.levels.getBaseSpeed() + 3) * speedMul;
            for (const b of this.balls) {
                if (!b.stuck) {
                    const currentSpeed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
                    if (currentSpeed < maxSpeed) {
                        const factor = (currentSpeed + 0.1) / currentSpeed;
                        b.dx *= factor; b.dy *= factor;
                        b.speed = currentSpeed + 0.1;
                    }
                }
            }
        }
    }

    applyPowerup(type) {
        this.powerups.activate(type);
        this.vfx.addFloatingText(this.paddle.x + this.paddle.w / 2, this.paddle.y - 20,
            type.toUpperCase() + '!', POWERUP_COLORS[type]);
        switch (type) {
            case 'multiball':
                if (this.balls.length < 8 && this.balls.length > 0) {
                    const src = this.balls[0];
                    const speed = Math.sqrt(src.dx * src.dx + src.dy * src.dy);
                    const angle = src.getAngle();
                    this.balls.push(new Ball(src.x, src.y, Math.cos(angle + 0.5) * speed, Math.sin(angle + 0.5) * speed, src.speed));
                    this.balls.push(new Ball(src.x, src.y, Math.cos(angle - 0.5) * speed, Math.sin(angle - 0.5) * speed, src.speed));
                }
                break;
            case 'laser':
                this.paddle.activateLaser(POWERUP_DURATIONS.laser);
                break;
            case 'giant':
                this.paddle.setWidth(160);
                break;
            case 'tiny':
                this.paddle.setWidth(40);
                break;
            case 'fireball':
                for (const ball of this.balls) ball.fireball = true;
                break;
            case 'magnet':
                this.paddle.magnetActive = true;
                break;
            case 'bomb':
                for (const ball of this.balls) ball.bomb = true;
                break;
            // slowmo, speeddemon, shield handled by PowerUpManager
        }
    }

    checkSkinUnlocks() {
        let newUnlock = false;
        for (const skin of PADDLE_SKINS) {
            if (this.unlockedSkins.includes(skin.id)) continue;
            if (!skin.unlock) continue;
            let met = false;
            switch (skin.unlock.type) {
                case 'score': met = this.highScore >= skin.unlock.value; break;
                case 'level': met = this.levels.currentLevel + 1 >= skin.unlock.value; break;
                case 'combo': met = this.maxComboEver >= skin.unlock.value; break;
                case 'boss': met = this.bossesDefeated >= skin.unlock.value; break;
            }
            if (met) {
                this.unlockedSkins.push(skin.id);
                newUnlock = true;
                this.vfx.addFloatingText(W / 2, H / 2 + 20, 'SKIN: ' + skin.name + '!', '#ffd700');
                this.audio.sfx('gold');
            }
        }
        if (newUnlock) {
            try { localStorage.setItem('breakout_skins', JSON.stringify(this.unlockedSkins)); } catch(e) {}
        }
    }

    getCurrentSkin() {
        return PADDLE_SKINS.find(s => s.id === this.selectedSkin) || PADDLE_SKINS[0];
    }

    onBossDefeated() {
        this.bossesDefeated++;
        this.audio.sfx('win');
        this.vfx.flash('#ffffff', 1.0);
        this.vfx.triggerShake(15);
        // Big bonus
        const bonus = (Math.floor(this.levels.currentLevel / 5) + 1) * 2000;
        this.score += bonus;
        this.checkSkinUnlocks();
        this.vfx.addFloatingText(W / 2, H / 3, 'BOSS DEFEATED! +' + bonus, '#ffcc44');
        // Explosion particles
        for (let i = 0; i < 60; i++) {
            this.particles.spawn(this.boss.x + rnd(-80, 80), this.boss.y + rnd(-30, 30),
                '#fff', 1, { randomColor: true, speed: 4, speedVar: 4, gravity: 0.05 });
        }
        // Trigger level complete after boss defeat animation
        this.updateHUD();
        // Use a brief delay before transitioning
        setTimeout(() => {
            if (this.state === 'playing') this.levelComplete();
        }, 1500);
    }

    applyComboEffect(comboId) {
        switch (comboId) {
            case 'meteorShower':
                // Spawn extra fireball balls
                if (this.balls.length > 0 && this.balls.length < 10) {
                    for (let i = 0; i < 3; i++) {
                        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
                        const speed = this.levels.getBaseSpeed() + 1;
                        const b = new Ball(rnd(50, W - 50), 60, Math.cos(angle) * speed, Math.sin(angle) * speed, speed);
                        b.fireball = true;
                        this.balls.push(b);
                    }
                }
                break;
            case 'megaBeam':
                // Extra wide paddle + rapid laser
                this.paddle.setWidth(200);
                this.paddle.activateLaser(600);
                this.paddle.laserInterval = 5; // much faster shooting
                break;
            case 'inferno':
                // All balls become super fireballs (larger trail)
                for (const ball of this.balls) {
                    ball.fireball = true;
                    ball.r = 7; // bigger ball
                }
                break;
            case 'fortress':
                // Max shields + magnet sticky
                this.powerups.shields = Math.min(this.powerups.shields + 2, 4);
                break;
            case 'precision':
                // Score bonus is handled in getScoreMult
                break;
        }
    }

    updateComboEffect(comboId) {
        // Per-frame combo effects
        if (comboId === 'meteorShower' && Math.random() < 0.02) {
            // Occasional extra fireballs from the sky
            if (this.balls.length < 12) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
                const speed = this.levels.getBaseSpeed();
                const b = new Ball(rnd(30, W - 30), 10, Math.cos(angle) * speed, Math.abs(Math.sin(angle)) * speed, speed);
                b.fireball = true;
                this.balls.push(b);
            }
        }
        if (comboId === 'inferno') {
            // Fire trail particles from each ball
            for (const ball of this.balls) {
                if (!ball.stuck && Math.random() < 0.3) {
                    this.particles.spawn(ball.x, ball.y, '#ff4400', 1, { speed: 0.5, speedVar: 1, size: 1, sizeVar: 2, decay: 0.05 });
                }
            }
        }
    }

    activatePartyMode(duration) {
        if (this.partyMode) { this.partyTimer = Math.max(this.partyTimer, duration); return; }
        this.partyMode = true;
        this.partyTimer = duration;
        document.body.classList.add('party-mode');
        this.paddle.setWidth(160);
        for (const ball of this.balls) ball.fireball = true;
        this.audio.sfx('partyActivate');
        this.vfx.triggerShake(10);
        this.vfx.flash('#ff44ff', 0.6);
        for (let i = 0; i < 50; i++) {
            this.particles.spawn(rnd(0, W), rnd(0, H * 0.6), '#fff', 3, { randomColor: true, speed: 3, speedVar: 3 });
        }
    }

    deactivatePartyMode() {
        this.partyMode = false;
        document.body.classList.remove('party-mode');
        if (!this.powerups.isActive('giant') && !this.powerups.isActive('tiny')) {
            this.paddle.setWidth(this.paddle.baseW);
        }
        if (!this.powerups.isActive('fireball')) {
            for (const ball of this.balls) ball.fireball = false;
        }
    }

    levelComplete() {
        this.state = 'leveltransition';
        this.levelTransitionTimer = 150;
        // Musik laeuft in Breakout ueber Level-Grenzen hinweg durch (wie in
        // Zaehlen/Buchstaben). Kein explizites Stoppen mehr.
        this.audio.sfx('levelUp');
        this.vfx.flash('#ffffff', 1.0);
        this.vfx.triggerShake(6);
        // Bonus points for lives
        const bonus = this.lives * 500;
        this.score += bonus;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            try { localStorage.setItem('breakout_highscore', this.highScore.toString()); } catch(e) {}
        }
        this.updateHUD();
        this.checkSkinUnlocks();
        // Puzzle reward
        if (this.puzzle) this.puzzle.revealNextPiece();
        // Show overlay
        const overlay = document.getElementById('level-overlay');
        overlay.classList.remove('hidden');
        const maxLvl = this.kidsMode ? 10 : 20;
        const nextIdx = this.levels.currentLevel + 1;
        const isLastLevel = nextIdx >= maxLvl;
        if (this.kidsMode) {
            overlay.querySelector('.level-complete-text').textContent = '\uD83C\uDF89 Super!';
            overlay.querySelector('.level-bonus-text').textContent = isLastLevel ? '' : 'Level ' + (nextIdx + 1);
            if (isLastLevel) {
                this._speak('Geschafft! Du bist super!');
            } else {
                this._speak('Super gemacht! Auf zu Level ' + this._numberWord(nextIdx + 1) + '!');
            }
        } else {
            overlay.querySelector('.level-complete-text').textContent = `LEVEL ${this.levels.currentLevel + 1} COMPLETE!`;
            overlay.querySelector('.level-bonus-text').textContent = `Lives Bonus: +${bonus}`;
        }
        // Explode all remaining bricks visually
        for (const brick of this.bricks) {
            if (brick.alive && brick.type === 'steel') {
                this.particles.spawnShatter(brick.x, brick.y, brick.w, brick.h, '#99aabc', 4);
            }
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.music.stopBackgroundMusic();
        const overlay = document.getElementById('game-over-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.gameover-score').textContent = 'Score: ' + this.score;
        overlay.querySelector('.gameover-highscore').textContent = 'High Score: ' + this.highScore;
        this._speak('Nochmal!');
    }

    winGame() {
        this.state = 'win';
        this.music.stopBackgroundMusic();
        this.audio.sfx('win');
        this.vfx.flash('#44ff88', 0.8);
        const overlay = document.getElementById('win-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.win-score').textContent = 'Final Score: ' + this.score;
        overlay.querySelector('.win-highscore').textContent = 'High Score: ' + this.highScore;
        this._speak('Super, du hast gewonnen!');
        // Epic particle explosion
        for (let i = 0; i < 100; i++) {
            this.particles.spawn(rnd(0, W), rnd(0, H), '#fff', 2, { randomColor: true, speed: 4, speedVar: 4, gravity: 0.05 });
        }
    }

    // --- Drawing ---
    draw() {
        const ctx = this.ctx;
        ctx.save();

        // Transforms
        this.vfx.applyTransforms(ctx);

        // Background
        const theme = WORLD_THEMES[this.currentWorld];
        ctx.fillStyle = this.partyMode ? `hsl(${Date.now()/10%360},30%,10%)` : theme.bg;
        ctx.fillRect(-20, -20, W + 40, H + 40);
        this.vfx.drawBackground(ctx, this.partyMode, theme);

        // Bricks
        for (const brick of this.bricks) brick.draw(ctx, this.partyMode, this.currentWorld);

        // Boss
        if (this.boss) this.boss.draw(ctx);

        // Shield
        this.powerups.drawShield(ctx);

        // Paddle
        this.paddle.draw(ctx, this.partyMode, this.getCurrentSkin());

        // Balls
        for (const ball of this.balls) {
            ball.draw(ctx, this.partyMode, this.vfx.chromaticOffset);
        }

        // Magnet aim line
        if (this.powerups.isActive('magnet')) {
            for (const ball of this.balls) {
                if (ball.stuck) {
                    const hitPos = (ball.x - this.paddle.x) / this.paddle.w;
                    const angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
                    ctx.strokeStyle = 'rgba(170,68,255,0.4)';
                    ctx.setLineDash([4, 4]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(ball.x, ball.y);
                    ctx.lineTo(ball.x + Math.cos(angle) * 80, ball.y + Math.sin(angle) * 80);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }

        // Powerups
        this.powerups.drawFalling(ctx);

        // Particles
        this.particles.draw(ctx);

        // VFX overlays
        this.vfx.drawOverlays(ctx);

        // Powerup HUD (canvas)
        this.powerups.drawHUD(ctx);

        // Combo text
        if (this.combo >= 5) {
            ctx.fillStyle = this.partyMode ? `hsl(${Date.now()/8%360},100%,70%)` : '#ffcc44';
            ctx.font = 'bold 14px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.combo}x COMBO!`, W / 2, H - 6);
            if (this.combo >= 15 && !this.partyMode) {
                ctx.fillStyle = 'rgba(255,200,100,0.5)';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText(`NOCH ${20 - this.combo}...`, W / 2, H - 50);
            }
        }

        // Party mode banner
        if (this.partyMode) {
            ctx.font = 'bold 22px system-ui';
            ctx.textAlign = 'center';
            ctx.fillStyle = `hsl(${Date.now()/6%360},100%,70%)`;
            const wobble = Math.sin(Date.now() / 100) * 4;
            ctx.fillText('PARTY MODE!', W / 2, 28 + wobble);
            // Timer bar
            const maxTimer = 1800;
            const frac = this.partyTimer / maxTimer;
            ctx.fillStyle = `hsla(${Date.now()/4%360},100%,60%,0.5)`;
            ctx.fillRect(W * 0.2, 34, W * 0.6 * frac, 4);
        }

        // Ball count
        if (this.balls.length > 1) {
            ctx.fillStyle = '#44ffff';
            ctx.font = 'bold 11px system-ui';
            ctx.textAlign = 'left';
            ctx.fillText('BALLS: ' + this.balls.length, 8, H - 6);
        }

        ctx.restore();
    }

    updateHUD() {
        const theme = WORLD_THEMES[this.currentWorld];
        const lvl = this.levels.currentLevel + 1;
        const emoji = theme && theme.emoji ? theme.emoji : '🎮';
        document.getElementById('level-display').textContent = emoji + ' L ' + lvl;
        const hearts = [];
        for (let i = 0; i < this.lives; i++) hearts.push('\u2764\uFE0F');
        document.getElementById('lives-display').textContent = hearts.join(' ');
        const stats = document.getElementById('pause-stats');
        if (stats) stats.textContent = 'Score: ' + this.score + '  ·  HI: ' + this.highScore;
    }

    _buildSkinGrid() {
        const grid = document.getElementById('skins-grid');
        grid.innerHTML = '';
        for (const skin of PADDLE_SKINS) {
            const unlocked = this.unlockedSkins.includes(skin.id);
            const selected = this.selectedSkin === skin.id;
            const card = document.createElement('div');
            card.className = 'skin-card' + (selected ? ' selected' : '') + (!unlocked ? ' locked' : '');
            // Preview bar
            const preview = document.createElement('div');
            preview.className = 'skin-preview';
            if (skin.colors === 'rainbow') {
                preview.style.background = 'linear-gradient(90deg, #ff4466, #ffcc44, #44ff88, #44bbff, #aa66ff)';
            } else if (skin.colors === 'galaxy') {
                preview.style.background = 'linear-gradient(90deg, #4400aa, #ffffff, #aa00ff)';
            } else {
                preview.style.background = `linear-gradient(180deg, ${skin.colors[0]}, ${skin.colors[1]})`;
            }
            card.appendChild(preview);
            const name = document.createElement('div');
            name.className = 'skin-name';
            name.textContent = skin.name;
            card.appendChild(name);
            if (!unlocked && skin.unlock) {
                const lock = document.createElement('div');
                lock.className = 'skin-lock';
                lock.textContent = skin.unlock.label;
                card.appendChild(lock);
            }
            if (unlocked) {
                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectedSkin = skin.id;
                    try { localStorage.setItem('breakout_skin', skin.id); } catch(e) {}
                    this._buildSkinGrid();
                });
            }
            grid.appendChild(card);
        }
    }

    _updatePauseMenu() {
        // Waehrend Quit-Confirm laeuft, blockiere Menue-Interaktionen.
        if (this._quitConfirmPrevState) {
            this.input.consumeClick();
            return;
        }
        // Klicks werden direkt per Button-Handler behandelt.
        this.input.consumeClick();
        if (this.input.wantsPause()) {
            this._executePauseAction('resume');
        }
    }

    _executePauseAction(action) {
        switch (action) {
            case 'resume':
                this.state = 'playing';
                this._closeParentSettings();
                // Hintergrundmusik (MP3) nach Pause fortsetzen.
                if (this.music && this.music.musicEnabled && this.music.backgroundMusic) {
                    try { this.music.backgroundMusic.play().catch(()=>{}); } catch(_) {}
                } else if (this.music && this.music.musicEnabled) {
                    try { this.music.playBackgroundMusic(); } catch(_) {}
                }
                break;
            case 'restart':
                this._closeParentSettings();
                this.startGame();
                break;
            case 'quit':
                this._closeParentSettings();
                this._showQuitConfirm();
                break;
            case 'nextLevel': {
                if (!this.parentMode) break;
                this._closeParentSettings();
                const nextLvl = this.levels.currentLevel + 1;
                const maxLvl = this.kidsMode ? 10 : 20;
                if (nextLvl >= maxLvl) {
                    this.winGame();
                } else {
                    this.state = 'playing';
                    this.loadLevel(nextLvl);
                    // Musik laeuft durch; nur neu anwerfen, falls vorher gestoppt.
                    if (this.music && this.music.musicEnabled && !this.music.backgroundMusic) {
                        try { this.music.playBackgroundMusic(); } catch(_) {}
                    } else if (this.music && this.music.musicEnabled && this.music.backgroundMusic && this.music.backgroundMusic.paused) {
                        try { this.music.backgroundMusic.play().catch(()=>{}); } catch(_) {}
                    }
                    this.updateHUD();
                }
                break;
            }
        }
    }

    pauseGame() {
        this.state = 'paused';
        this.updateHUD();
        this._openParentSettings();
        // Hintergrundmusik (MP3) waehrend Pause anhalten - bei 'resume' wieder
        // weiter (Position bleibt erhalten).
        if (this.music && this.music.backgroundMusic) {
            try { this.music.backgroundMusic.pause(); } catch(_) {}
        }
    }

    hideAllOverlays() {
        ['game-over-overlay', 'win-overlay', 'level-overlay', 'pause-overlay', 'skins-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════
new Game();

})();
