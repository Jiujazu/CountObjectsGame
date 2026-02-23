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
const POWERUP_WEIGHTS = {
    multiball:15, laser:10, giant:15, tiny:5, fireball:10,
    slowmo:10, speeddemon:10, shield:15, magnet:5, bomb:5
};
const POWERUP_DURATIONS = {
    laser:480, giant:600, tiny:600, fireball:360, slowmo:300, speeddemon:480, magnet:600
};

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
        this.musicGain = null;
        this.sfxGain = null;
        this.bpm = 140;
        this.currentStep = 0;
        this.stepTimer = null;
        this.isPlaying = false;
        this.levelTheme = 0;
        this.comboIntensity = 0;
        this.onBeatCallback = null;
        // Level-specific bass notes (Hz)
        this.bassNotes = [
            [65, 78, 87, 98, 117],    // L1: C minor pentatonic
            [73, 87, 110, 147],        // L2: D minor
            [82, 87, 98, 123],         // L3: E phrygian
            [92, 110, 131, 156],       // L4: F# diminished
            [55, 65, 82, 104]          // L5: A minor harmonic
        ];
        // Bass patterns per level (16 steps, index into bassNotes or -1 for rest)
        this.bassPatterns = [
            [0,-1,-1,-1,2,-1,-1,-1,0,-1,-1,-1,3,-1,1,-1],
            [0,-1,1,-1,-1,-1,2,-1,0,-1,-1,-1,3,-1,-1,1],
            [0,-1,-1,1,-1,-1,2,-1,0,-1,3,-1,-1,-1,1,-1],
            [0,1,-1,2,-1,3,-1,0,1,-1,2,-1,3,-1,0,-1],
            [0,-1,-1,-1,1,-1,2,-1,3,-1,-1,-1,0,-1,2,1]
        ];
        // Lead melody patterns per level (Hz or 0 for rest)
        this.leadPatterns = [
            [392,0,0,330,0,0,294,0,392,0,0,440,0,0,330,0],
            [523,0,494,0,440,0,392,0,523,0,587,0,523,0,0,0],
            [330,330,0,294,0,262,0,330,0,294,0,262,0,220,0,0],
            [440,523,587,523,440,523,587,659,440,523,587,523,440,0,0,0],
            [262,0,330,0,392,0,494,0,523,0,494,0,392,0,330,262]
        ];
        // Kick patterns (1=hit, 0=rest)
        this.kickPatterns = [
            [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
            [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0],
            [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0],
            [1,0,1,0,0,1,0,0,1,0,1,0,0,0,1,1],
            [1,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1]
        ];
        // Hihat patterns
        this.hihatPatterns = [
            [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0],
            [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
            [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],
            [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        this.baseBPMs = [130, 140, 145, 155, 165];
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(this.masterGain);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.masterGain);
    }

    startMusic(levelIndex) {
        this.init();
        this.levelTheme = clamp(levelIndex, 0, 4);
        this.bpm = this.baseBPMs[this.levelTheme];
        this.currentStep = 0;
        this.isPlaying = true;
        this._scheduleStep();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.stepTimer) { clearTimeout(this.stepTimer); this.stepTimer = null; }
    }

    pauseMusic() { this.stopMusic(); }
    resumeMusic(levelIndex) { if (!this.isPlaying) this.startMusic(levelIndex); }

    setCombo(combo) {
        this.comboIntensity = Math.min(combo / 20, 1.0);
        this.bpm = this.baseBPMs[this.levelTheme] + Math.min(combo * 2, 40);
    }

    _scheduleStep() {
        if (!this.isPlaying) return;
        const stepMs = 60000 / this.bpm / 4;
        this.stepTimer = setTimeout(() => {
            this._playStep();
            this.currentStep = (this.currentStep + 1) % 16;
            this._scheduleStep();
        }, stepMs);
    }

    _playStep() {
        const s = this.currentStep;
        const t = this.ctx.currentTime;
        const lv = this.levelTheme;
        // Kick
        if (this.kickPatterns[lv][s]) this._playKick(t);
        // Hi-hat
        if (this.hihatPatterns[lv][s]) this._playHihat(t, this.comboIntensity > 0.5 ? 0.06 : 0.035);
        // Bass
        const bassIdx = this.bassPatterns[lv][s];
        if (bassIdx >= 0) {
            const freq = this.bassNotes[lv][bassIdx % this.bassNotes[lv].length];
            this._playBass(t, freq);
        }
        // Lead
        const leadFreq = this.leadPatterns[lv][s];
        if (leadFreq > 0) this._playLead(t, leadFreq);
        // Beat callback
        if (this.onBeatCallback && (s % 4 === 0)) this.onBeatCallback(s);
    }

    _playKick(t) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain); gain.connect(this.musicGain);
            osc.start(t); osc.stop(t + 0.15);
        } catch(e) {}
    }

    _playHihat(t, vol = 0.035) {
        try {
            const bufSize = this.ctx.sampleRate * 0.02;
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass'; filter.frequency.value = 8000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            src.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
            src.start(t); src.stop(t + 0.04);
        } catch(e) {}
    }

    _playBass(t, freq) {
        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            filter.type = 'lowpass';
            filter.frequency.value = 300 + this.comboIntensity * 600;
            filter.Q.value = 3;
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
            osc.start(t); osc.stop(t + 0.12);
        } catch(e) {}
    }

    _playLead(t, freq) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            const vol = 0.04 + this.comboIntensity * 0.04;
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain); gain.connect(this.musicGain);
            osc.start(t); osc.stop(t + 0.1);
            // Chorus at high intensity
            if (this.comboIntensity > 0.5) {
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'square';
                osc2.frequency.value = freq * 1.004;
                gain2.gain.setValueAtTime(vol * 0.5, t);
                gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                osc2.connect(gain2); gain2.connect(this.musicGain);
                osc2.start(t); osc2.stop(t + 0.1);
            }
        } catch(e) {}
    }

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

    _sfx_wallHit(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 220;
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.05);
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
        this.floatingTexts.push({ x, y, text, color, life: 80, dy: -1.5 });
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

    drawBackground(ctx, partyMode) {
        // Starfield
        for (const star of this.stars) {
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = partyMode ? `hsl(${Date.now()/10 + star.x}%360,100%,80%)` : '#ccccff';
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
    }

    getColor(partyMode) {
        if (partyMode) return `hsl(${(Date.now()/5 + this.x + this.y)%360},80%,55%)`;
        switch (this.type) {
            case 'steel': return '#99aabc';
            case 'multihit':
                if (this.hp >= 3) return '#44ff88';
                if (this.hp >= 2) return '#ffcc44';
                return '#ff4466';
            case 'explosive': return '#ff6622';
            case 'moving': return ROW_COLORS[this.row % ROW_COLORS.length];
            case 'gold': return '#ffd700';
            default: return ROW_COLORS[this.row % ROW_COLORS.length];
        }
    }

    update() {
        if (!this.alive) return;
        if (this.hitFlash > 0) this.hitFlash--;
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
    }

    draw(ctx, partyMode) {
        if (!this.alive) return;
        const color = this.getColor(partyMode);
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
    }

    update(speedMult = 1) {
        if (this.stuck) return;
        this.x += this.dx * speedMult;
        this.y += this.dy * speedMult;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 14) this.trail.shift();
    }

    draw(ctx, partyMode, chromaticOffset = 0) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = i / this.trail.length;
            ctx.globalAlpha = t * 0.3;
            ctx.fillStyle = this.fireball ? '#ff8844' : (partyMode ? `hsl(${Date.now()/3+i*30}%360,100%,60%)` : '#fff');
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
                this.laserCooldown = 12;
            }
        }
        // Update laser bolts
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].y += this.lasers[i].dy;
            if (this.lasers[i].y < 0) this.lasers.splice(i, 1);
        }
    }

    draw(ctx, partyMode) {
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
        } else {
            grad.addColorStop(0, '#aaaaff');
            grad.addColorStop(1, '#6666cc');
        }
        ctx.fillStyle = grad;
        ctx.shadowColor = this.laserActive ? '#ff4444' : (this.magnetActive ? '#aa44ff' : '#8888ff');
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
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 15 * glow;
        // Pill shape
        ctx.fillStyle = color;
        ctx.beginPath();
        roundRect(ctx, -this.w / 2, -this.h / 2, this.w, this.h, this.h / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Letter
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_SYMBOLS[this.type], 0, 1);
        ctx.restore();
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
    }

    trySpawn(x, y, partyMode) {
        if (this.falling.length >= this.maxFalling) return;
        const chance = partyMode ? 0.5 : 0.25;
        if (Math.random() > chance) return;
        // Weighted random selection
        const totalWeight = Object.values(POWERUP_WEIGHTS).reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let type = 'multiball';
        for (const [t, w] of Object.entries(POWERUP_WEIGHTS)) {
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

    reset() {
        this.falling = [];
        this.activeEffects = {};
        this.shields = 0;
    }
}

// ═══════════════════════════════════════════════════════════════
// LEVEL MANAGER
// ═══════════════════════════════════════════════════════════════
class LevelManager {
    constructor() {
        this.currentLevel = 0;
        this.baseSpeeds = [4, 4.5, 5, 5, 5.5];
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

    getBricks(levelIndex) {
        const layout = this.layouts[clamp(levelIndex, 0, this.layouts.length - 1)];
        const bricks = [];
        for (let r = 0; r < layout.length; r++) {
            const row = layout[r];
            for (let c = 0; c < BRICK_COLS; c++) {
                const ch = c < row.length ? row[c] : '.';
                if (ch === '.' || ch === ' ') continue;
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
                bricks.push(brick);
            }
        }
        return bricks;
    }

    getBaseSpeed() {
        return this.baseSpeeds[clamp(this.currentLevel, 0, this.baseSpeeds.length - 1)];
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
// INPUT MANAGER
// ═══════════════════════════════════════════════════════════════
class InputManager {
    constructor(canvas) {
        this.keys = {};
        this.mouseX = W / 2;
        this.useMouse = false;
        this.clicked = false;
        this.konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
        this.konamiIdx = 0;
        this.konamiTriggered = false;

        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
            // Konami
            if (e.key === this.konamiSeq[this.konamiIdx]) {
                this.konamiIdx++;
                if (this.konamiIdx === this.konamiSeq.length) {
                    this.konamiIdx = 0;
                    this.konamiTriggered = true;
                }
            } else {
                this.konamiIdx = 0;
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (W / rect.width);
            this.useMouse = true;
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            this.mouseX = (e.touches[0].clientX - rect.left) * (W / rect.width);
            this.useMouse = true;
        }, { passive: false });
        const handleClick = () => { this.clicked = true; };
        document.addEventListener('click', handleClick);
        canvas.addEventListener('touchstart', handleClick);
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

    consumeKonami() {
        if (this.konamiTriggered) { this.konamiTriggered = false; return true; }
        return false;
    }

    wantsStart() {
        return this.keys[' '] || this.keys['Enter'] || this.consumeClick();
    }

    wantsPause() {
        const p = this.keys['p'] || this.keys['P'];
        if (p) { this.keys['p'] = false; this.keys['P'] = false; }
        return p;
    }

    wantsRelease() {
        return this.keys[' '] || this.consumeClick();
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
        this.particles = new ParticleSystem();
        this.vfx = new VisualEffects();
        this.paddle = new Paddle();
        this.powerups = new PowerUpManager();
        this.levels = new LevelManager();
        this.input = new InputManager(this.canvas);

        this.state = 'start'; // start | playing | paused | leveltransition | gameover | win
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.partyMode = false;
        this.partyTimer = 0;
        this.bricks = [];
        this.balls = [];
        this.bricksDestroyed = 0;
        this.nextExtraLife = 5000;
        this.highScore = parseInt(localStorage.getItem('breakout_highscore') || '0');
        this.levelTransitionTimer = 0;
        this.newHighScoreFlag = false;

        // Audio beat sync
        this.audio.onBeatCallback = () => this.vfx.onBeat(this.partyMode);

        this.updateHUD();
        this.loop();
    }

    // --- State transitions ---
    startGame() {
        this.audio.init();
        this.state = 'playing';
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.bricksDestroyed = 0;
        this.nextExtraLife = 5000;
        this.partyMode = false;
        this.partyTimer = 0;
        this.newHighScoreFlag = false;
        document.body.classList.remove('party-mode');
        this.levels.currentLevel = 0;
        this.powerups.reset();
        this.paddle = new Paddle();
        this.loadLevel(0);
        this.audio.startMusic(0);
        this.hideAllOverlays();
        this.updateHUD();
    }

    loadLevel(idx) {
        this.levels.currentLevel = idx;
        this.bricks = this.levels.getBricks(idx);
        this.bricksDestroyed = 0;
        this.resetBalls();
    }

    resetBalls() {
        const speed = this.levels.getBaseSpeed();
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        this.balls = [new Ball(W / 2, H - 50, Math.cos(angle) * speed, Math.sin(angle) * speed, speed)];
    }

    // --- Main loop ---
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // --- Update ---
    update() {
        // Handle state-independent input
        if (this.state === 'start' || this.state === 'gameover' || this.state === 'win') {
            if (this.input.wantsStart()) this.startGame();
            return;
        }

        if (this.state === 'paused') {
            if (this.input.wantsPause()) {
                this.state = 'playing';
                document.getElementById('pause-overlay').classList.add('hidden');
                this.audio.resumeMusic(this.levels.currentLevel);
            }
            return;
        }

        if (this.state === 'leveltransition') {
            this.levelTransitionTimer--;
            this.particles.update();
            this.vfx.update(this.combo, this.partyMode);
            if (this.levelTransitionTimer <= 0) {
                this.state = 'playing';
                document.getElementById('level-overlay').classList.add('hidden');
                const nextLvl = this.levels.currentLevel + 1;
                if (nextLvl >= this.levels.layouts.length) {
                    this.winGame();
                    return;
                }
                this.loadLevel(nextLvl);
                this.audio.startMusic(nextLvl);
                this.updateHUD();
            }
            return;
        }

        // Playing state
        if (this.input.wantsPause()) {
            this.state = 'paused';
            document.getElementById('pause-overlay').classList.remove('hidden');
            this.audio.pauseMusic();
            return;
        }

        // Konami check
        if (this.input.consumeKonami()) {
            this.activatePartyMode(1800);
        }

        const speedMult = this.powerups.getSpeedMult();

        // Paddle
        this.paddle.update(this.input.getDir(), this.input.mouseX, this.input.useMouse);

        // Handle magnet release
        if (this.powerups.isActive('magnet')) {
            for (const ball of this.balls) {
                if (ball.stuck) {
                    ball.x = this.paddle.x + this.paddle.w / 2 + ball.stuckOffset;
                    ball.y = this.paddle.y - ball.r;
                    if (this.input.wantsRelease()) {
                        ball.stuck = false;
                        const hitPos = (ball.x - this.paddle.x) / this.paddle.w;
                        const angle = -Math.PI / 2 + (hitPos - 0.5) * 1.2;
                        ball.setAngle(angle, ball.speed);
                    }
                }
            }
        }

        // Balls
        for (const ball of this.balls) {
            ball.update(speedMult);

            // Wall collisions
            if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.dx = Math.abs(ball.dx); this.audio.sfx('wallHit'); }
            if (ball.x + ball.r >= W) { ball.x = W - ball.r; ball.dx = -Math.abs(ball.dx); this.audio.sfx('wallHit'); }
            if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.dy = Math.abs(ball.dy); this.audio.sfx('wallHit'); }

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
                this.audio.sfx('paddleHit');
                this.particles.spawn(ball.x, ball.y, '#8888ff', 4);
            }

            // Brick collision
            if (!ball.stuck) this.checkBrickCollisions(ball);
        }

        // Remove dead balls
        this.balls = this.balls.filter(b => b.alive);
        if (this.balls.length === 0) {
            this.lives--;
            this.combo = 0;
            if (this.partyMode) this.deactivatePartyMode();
            this.audio.sfx('loseLife');
            this.vfx.triggerShake(8);
            this.vfx.flash('#ff0000', 0.4);
            this.updateHUD();
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBalls();
            }
        }

        // Laser vs bricks
        for (let i = this.paddle.lasers.length - 1; i >= 0; i--) {
            const laser = this.paddle.lasers[i];
            for (const brick of this.bricks) {
                if (!brick.alive) continue;
                if (laser.x >= brick.x && laser.x <= brick.x + brick.w &&
                    laser.y >= brick.y && laser.y <= brick.y + brick.h) {
                    this.destroyBrick(brick);
                    this.paddle.lasers.splice(i, 1);
                    break;
                }
            }
        }

        // Bricks update (moving)
        for (const brick of this.bricks) brick.update();

        // Powerup collection
        const collected = this.powerups.update(this.paddle);
        for (const type of collected) {
            this.audio.sfx('powerup');
            this.applyPowerup(type);
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
                if (ball.stuck) {
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

        // Check level complete
        if (this.levels.isLevelComplete(this.bricks)) {
            this.levelComplete();
        }

        // Extra life
        if (this.score >= this.nextExtraLife && this.lives < 5) {
            this.lives++;
            this.nextExtraLife += 5000;
            this.audio.sfx('extraLife');
            this.vfx.addFloatingText(W / 2, H / 2, '+1 UP!', '#44ff88');
            this.vfx.flash('#44ff88', 0.3);
            this.updateHUD();
        }

        this.particles.update();
        this.vfx.update(this.combo, this.partyMode);
        this.audio.setCombo(this.combo);
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
        // Check high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('breakout_highscore', this.highScore.toString());
            if (!this.newHighScoreFlag) {
                this.newHighScoreFlag = true;
                document.getElementById('highscore-display').classList.add('new-record');
                this.vfx.addFloatingText(W / 2, H / 3, 'NEW HIGH SCORE!', '#ffcc44');
            }
        }
        this.updateHUD();
        // Audio
        if (!isExplosion) this.audio.sfx('brickHit', brick.row);
        // VFX
        this.particles.spawnShatter(brick.x, brick.y, brick.w, brick.h, brick.getColor(false), 6);
        this.particles.spawn(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.getColor(false), 6);
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
        this.powerups.trySpawn(brick.x + brick.w / 2, brick.y + brick.h / 2, this.partyMode);
        // Ball speed increase every 5 bricks
        if (this.bricksDestroyed % 5 === 0) {
            const maxSpeed = this.levels.getBaseSpeed() + 3;
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
        this.audio.stopMusic();
        this.audio.sfx('levelUp');
        this.vfx.flash('#ffffff', 1.0);
        this.vfx.triggerShake(6);
        // Bonus points for lives
        const bonus = this.lives * 500;
        this.score += bonus;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('breakout_highscore', this.highScore.toString());
        }
        this.updateHUD();
        // Show overlay
        const overlay = document.getElementById('level-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.level-complete-text').textContent = `LEVEL ${this.levels.currentLevel + 1} COMPLETE!`;
        overlay.querySelector('.level-bonus-text').textContent = `Lives Bonus: +${bonus}`;
        // Explode all remaining bricks visually
        for (const brick of this.bricks) {
            if (brick.alive && brick.type === 'steel') {
                this.particles.spawnShatter(brick.x, brick.y, brick.w, brick.h, '#99aabc', 4);
            }
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.stopMusic();
        const overlay = document.getElementById('game-over-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.gameover-score').textContent = 'Score: ' + this.score;
        overlay.querySelector('.gameover-highscore').textContent = 'High Score: ' + this.highScore;
    }

    winGame() {
        this.state = 'win';
        this.audio.stopMusic();
        this.audio.sfx('win');
        this.vfx.flash('#44ff88', 0.8);
        const overlay = document.getElementById('win-overlay');
        overlay.classList.remove('hidden');
        overlay.querySelector('.win-score').textContent = 'Final Score: ' + this.score;
        overlay.querySelector('.win-highscore').textContent = 'High Score: ' + this.highScore;
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
        ctx.fillStyle = this.partyMode ? `hsl(${Date.now()/10%360},30%,10%)` : '#111133';
        ctx.fillRect(-20, -20, W + 40, H + 40);
        this.vfx.drawBackground(ctx, this.partyMode);

        // Bricks
        for (const brick of this.bricks) brick.draw(ctx, this.partyMode);

        // Shield
        this.powerups.drawShield(ctx);

        // Paddle
        this.paddle.draw(ctx, this.partyMode);

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
                ctx.fillText(`Noch ${20 - this.combo}...`, W / 2, H - 50);
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
            ctx.fillText('Balls: ' + this.balls.length, 8, H - 6);
        }

        ctx.restore();
    }

    // --- UI ---
    updateHUD() {
        document.getElementById('score-display').textContent = 'Score: ' + this.score;
        document.getElementById('level-display').textContent = 'Level ' + (this.levels.currentLevel + 1);
        document.getElementById('highscore-display').textContent = 'HI: ' + this.highScore;
        const hearts = [];
        for (let i = 0; i < this.lives; i++) hearts.push('\u2764\uFE0F');
        document.getElementById('lives-display').textContent = hearts.join(' ');
    }

    hideAllOverlays() {
        ['start-overlay', 'game-over-overlay', 'win-overlay', 'level-overlay', 'pause-overlay'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════
new Game();

})();
