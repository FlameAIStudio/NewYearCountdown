// ==================== 配置 ====================
const CONFIG = {
    colors: {
        gold: ['#FFD700', '#FFC125', '#DAA520', '#F4A460'],
        white: ['#FFFFFF', '#FFF8DC', '#FFFACD'],
        pink: ['#FF69B4', '#FF1493', '#FF6B9D', '#FFB6C1'],
        blue: ['#00BFFF', '#1E90FF', '#00CED1', '#87CEEB'],
        purple: ['#9370DB', '#8A2BE2', '#DA70D6', '#EE82EE'],
        green: ['#00FF7F', '#7CFC00', '#ADFF2F', '#32CD32'],
        red: ['#FF4500', '#FF6347', '#FF7F50', '#DC143C'],
        cyan: ['#00FFFF', '#40E0D0', '#48D1CC']
    },
    // 提高粒子上限
    maxParticles: 1500,
    maxFireworks: 35,
    maxSparklers: 18
};

// ==================== 全局变量 ====================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countdownEl = document.getElementById('countdown');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');

let particles = [];
let fireworks = [];
let sparklers = [];
let textGlitters = []; // 文字周围的金色粒子
let phase = 'waiting';
let countdownValue = 10;
let lastCountdownTime = 0;
let audioCtx = null;
let totalParticleCount = 0;

// ==================== 初始化 ====================
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    startBtn.addEventListener('click', startCountdown);
    animate();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// ==================== 音频系统（优化版） ====================
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// 倒计时音效 - 打字机机械敲击声
function playCountdownBeep(number) {
    if (!audioCtx) return;
    
    const t = audioCtx.currentTime;
    const intensity = (11 - number) / 10;
    
    // 打字机的核心：短促的噪声冲击 + 金属共振
    const bufferSize = audioCtx.sampleRate * 0.05; // 50ms 很短
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 生成短促的点击噪声
    for (let i = 0; i < bufferSize; i++) {
        // 快速衰减的噪声，模拟机械撞击
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    // 高通滤波让声音更清脆
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0.4 + intensity * 0.2, t);
    source.start(t);
    
    // 叠加一个金属共振音
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 3500 + intensity * 500; // 高频金属音
    oscGain.gain.setValueAtTime(0.08, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
}

// 烟花爆炸音效
function playBoom() {
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * 0.3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }
    
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    
    source.start();
}

// ==================== 简化粒子类 ====================
class Particle {
    constructor(x, y, color, vx, vy, size, gravity, decay) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.gravity = gravity;
        this.decay = decay;
        this.alpha = 1;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }

    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.alpha <= 0;
    }
}


// ==================== 烟花类（优化版） ====================
class Firework {
    constructor(x, y, type) {
        this.particles = [];
        const colors = this.getColors(type);
        const count = type === 'big' ? 60 : 40; // 减少粒子数
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = 2 + Math.random() * 3;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.particles.push(new Particle(
                x, y, color,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                1.5 + Math.random(),
                0.05,
                0.015 + Math.random() * 0.008
            ));
        }
        totalParticleCount += count;
        playBoom();
    }

    getColors(type) {
        // 更丰富的颜色组合
        const rand = Math.random();
        if (rand < 0.15) return CONFIG.colors.gold;
        if (rand < 0.25) return [...CONFIG.colors.gold, ...CONFIG.colors.white];
        if (rand < 0.35) return [...CONFIG.colors.pink, ...CONFIG.colors.white];
        if (rand < 0.45) return [...CONFIG.colors.blue, ...CONFIG.colors.cyan];
        if (rand < 0.55) return [...CONFIG.colors.purple, ...CONFIG.colors.pink];
        if (rand < 0.65) return [...CONFIG.colors.green, ...CONFIG.colors.gold];
        if (rand < 0.75) return [...CONFIG.colors.red, ...CONFIG.colors.gold];
        if (rand < 0.85) return [...CONFIG.colors.blue, ...CONFIG.colors.purple, ...CONFIG.colors.pink];
        return [...CONFIG.colors.gold, ...CONFIG.colors.pink, ...CONFIG.colors.cyan];
    }

    update() {
        this.particles.forEach(p => p.update());
        const before = this.particles.length;
        this.particles = this.particles.filter(p => !p.isDead());
        totalParticleCount -= (before - this.particles.length);
    }

    draw() {
        this.particles.forEach(p => p.draw());
    }

    isDead() {
        return this.particles.length === 0;
    }
}

// ==================== 仙女棒（简化版） ====================
class Sparkler {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.particles = [];
        this.life = 80;
    }

    update() {
        if (this.life > 0) {
            // 每帧发射3个粒子，颜色更丰富
            for (let i = 0; i < 3; i++) {
                if (totalParticleCount < CONFIG.maxParticles) {
                    const allColors = [
                        ...CONFIG.colors.gold, 
                        ...CONFIG.colors.white,
                        ...CONFIG.colors.pink,
                        ...CONFIG.colors.cyan
                    ];
                    this.particles.push(new Particle(
                        this.x + (Math.random() - 0.5) * 10,
                        this.y,
                        allColors[Math.floor(Math.random() * allColors.length)],
                        (Math.random() - 0.5) * 1.5,
                        1 + Math.random() * 1.5,
                        1 + Math.random() * 0.5,
                        0.02,
                        0.025
                    ));
                    totalParticleCount++;
                }
            }
            this.life--;
            this.x += (Math.random() - 0.5) * 2;
            this.y += 0.8;
        }
        
        this.particles.forEach(p => p.update());
        const before = this.particles.length;
        this.particles = this.particles.filter(p => !p.isDead());
        totalParticleCount -= (before - this.particles.length);
    }

    draw() {
        this.particles.forEach(p => p.draw());
    }

    isDead() {
        return this.life <= 0 && this.particles.length === 0;
    }
}

// ==================== 上升烟花 ====================
class Rising {
    constructor(tx, ty) {
        this.x = tx + (Math.random() - 0.5) * 80;
        this.y = canvas.height;
        this.tx = tx;
        this.ty = ty;
        this.vy = -10 - Math.random() * 3;
        this.done = false;
    }

    update() {
        this.y += this.vy;
        this.vy += 0.12;
        
        if (this.vy >= 0 || this.y <= this.ty) {
            this.done = true;
            if (fireworks.length < CONFIG.maxFireworks) {
                fireworks.push(new Firework(this.x, this.y, 'normal'));
            }
        }
    }

    draw() {
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==================== 发射烟花 ====================
function launch(count = 1) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            if (totalParticleCount < CONFIG.maxParticles) {
                const tx = canvas.width * 0.15 + Math.random() * canvas.width * 0.7;
                const ty = canvas.height * 0.15 + Math.random() * canvas.height * 0.35;
                particles.push(new Rising(tx, ty));
            }
        }, i * 150);
    }
}

function addSparkler() {
    if (sparklers.length < CONFIG.maxSparklers) {
        sparklers.push(new Sparkler(Math.random() * canvas.width));
    }
}


// ==================== 倒计时 ====================
function startCountdown() {
    initAudio();
    startBtn.style.display = 'none';
    phase = 'countdown';
    countdownValue = 10;
    lastCountdownTime = Date.now();
    tick();
}

function tick() {
    if (phase !== 'countdown') return;
    
    // 显示数字（1-10，不显示0）
    countdownEl.textContent = countdownValue;
    countdownEl.classList.add('show', 'pulse');
    playCountdownBeep(countdownValue);
    
    // 根据阶段发射烟花
    if (countdownValue >= 6) {
        // 10-6: 少量
        if (Math.random() < 0.5) launch(1);
        if (countdownValue <= 8 && Math.random() < 0.3) addSparkler();
    } else if (countdownValue >= 3) {
        // 5-3: 增加
        launch(2);
        if (Math.random() < 0.5) addSparkler();
    } else {
        // 2-1: 拉满
        launch(2);
        addSparkler();
    }
    
    setTimeout(() => {
        countdownEl.classList.remove('pulse');
    }, 400);
    
    countdownValue--;
    
    if (countdownValue >= 1) {
        // 还有数字要显示，精确1秒间隔
        setTimeout(tick, 1000);
    } else {
        // 1 显示完后，等待1秒（凑满10秒），然后立即进入庆祝
        setTimeout(() => {
            countdownEl.classList.remove('show');
            celebrate();
        }, 1000);
    }
}

// ==================== 庆祝 ====================
let flashAlpha = 0;
let shakeIntensity = 0;

function celebrate() {
    phase = 'celebration';
    
    // 强烈白光闪烁
    flashAlpha = 0.6;
    shakeIntensity = 15;
    
    // 播放大爆炸音效
    playBigBoom();
    
    // 第一波：中心大爆发（立即）
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;
    fireworks.push(new Firework(cx, cy, 'big'));
    fireworks.push(new Firework(cx - 100, cy + 50, 'big'));
    fireworks.push(new Firework(cx + 100, cy + 50, 'big'));
    
    // 第二波：四周爆发（200ms后）- 不再播放钟声
    setTimeout(() => {
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = cx + Math.cos(angle) * 200;
            const y = cy + Math.sin(angle) * 100;
            fireworks.push(new Firework(x, y, 'big'));
        }
    }, 200);
    
    // 第三波：随机位置连续爆发
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const x = canvas.width * 0.1 + Math.random() * canvas.width * 0.8;
            const y = canvas.height * 0.15 + Math.random() * canvas.height * 0.35;
            fireworks.push(new Firework(x, y, 'big'));
            // 同时添加仙女棒
            addSparkler();
            addSparkler();
        }, 400 + i * 120);
    }
    
    // 显示文字（立即出现，和烟花同步）
    messageEl.classList.add('show');
    
    // 文字出现时再来一波
    setTimeout(() => {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const x = canvas.width * 0.2 + Math.random() * canvas.width * 0.6;
                const y = canvas.height * 0.2 + Math.random() * canvas.height * 0.2;
                fireworks.push(new Firework(x, y, 'big'));
            }, i * 150);
        }
    }, 800);
    
    // 持续烟花（更密集）
    setInterval(() => {
        if (Math.random() < 0.7 && totalParticleCount < CONFIG.maxParticles * 0.9) {
            launch(1);
        }
        if (Math.random() < 0.5) {
            addSparkler();
        }
    }, 200);
}

// 礼堂钟声 - 更温暖厚重
function playBigBoom() {
    if (!audioCtx) return;
    
    const t = audioCtx.currentTime;
    
    // 用噪声模拟敲击的瞬间冲击
    const impactSize = audioCtx.sampleRate * 0.08;
    const impactBuffer = audioCtx.createBuffer(1, impactSize, audioCtx.sampleRate);
    const impactData = impactBuffer.getChannelData(0);
    for (let i = 0; i < impactSize; i++) {
        impactData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (impactSize * 0.1)) * 0.3;
    }
    const impact = audioCtx.createBufferSource();
    const impactGain = audioCtx.createGain();
    const impactFilter = audioCtx.createBiquadFilter();
    impactFilter.type = 'bandpass';
    impactFilter.frequency.value = 800;
    impactFilter.Q.value = 2;
    impact.buffer = impactBuffer;
    impact.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(audioCtx.destination);
    impactGain.gain.setValueAtTime(0.5, t);
    impact.start(t);
    
    // 钟声基音 - 更低沉温暖 (C3 约130Hz)
    const bell1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    bell1.type = 'sine';
    bell1.frequency.value = 130;
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.setTargetAtTime(0.001, t + 0.1, 1.2); // 更自然的衰减
    bell1.connect(gain1);
    gain1.connect(audioCtx.destination);
    bell1.start(t);
    bell1.stop(t + 4);
    
    // 第二泛音 (约2.4倍频，模拟真实钟声的非谐波特性)
    const bell2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    bell2.type = 'sine';
    bell2.frequency.value = 312;
    gain2.gain.setValueAtTime(0.2, t);
    gain2.gain.setTargetAtTime(0.001, t + 0.1, 1.0);
    bell2.connect(gain2);
    gain2.connect(audioCtx.destination);
    bell2.start(t);
    bell2.stop(t + 3.5);
    
    // 第三泛音
    const bell3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    bell3.type = 'sine';
    bell3.frequency.value = 527;
    gain3.gain.setValueAtTime(0.12, t);
    gain3.gain.setTargetAtTime(0.001, t + 0.1, 0.8);
    bell3.connect(gain3);
    gain3.connect(audioCtx.destination);
    bell3.start(t);
    bell3.stop(t + 3);
    
    // 高频泛音 - 增加金属质感
    const bell4 = audioCtx.createOscillator();
    const gain4 = audioCtx.createGain();
    bell4.type = 'sine';
    bell4.frequency.value = 785;
    gain4.gain.setValueAtTime(0.06, t);
    gain4.gain.setTargetAtTime(0.001, t + 0.05, 0.5);
    bell4.connect(gain4);
    gain4.connect(audioCtx.destination);
    bell4.start(t);
    bell4.stop(t + 2);
}

// ==================== 主循环 ====================
function animate() {
    // 屏幕震动效果
    if (shakeIntensity > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * shakeIntensity,
            (Math.random() - 0.5) * shakeIntensity
        );
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.5) shakeIntensity = 0;
    }
    
    // 半透明覆盖产生拖尾
    ctx.fillStyle = 'rgba(0, 0, 15, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 白光闪烁效果
    if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashAlpha *= 0.85;
        if (flashAlpha < 0.01) flashAlpha = 0;
    }
    
    // 上升烟花
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    particles = particles.filter(p => !p.done);
    
    // 爆炸烟花
    fireworks.forEach(f => {
        f.update();
        f.draw();
    });
    fireworks = fireworks.filter(f => !f.isDead());
    
    // 仙女棒
    sparklers.forEach(s => {
        s.update();
        s.draw();
    });
    sparklers = sparklers.filter(s => !s.isDead());
    
    // 等待阶段背景烟花（更密集）
    if (phase === 'waiting' && Math.random() < 0.25 && totalParticleCount < CONFIG.maxParticles * 0.7) {
        launch(1);
        if (Math.random() < 0.4) addSparkler();
    }
    
    if (shakeIntensity > 0) {
        ctx.restore();
    }
    
    requestAnimationFrame(animate);
}

// 启动
init();
