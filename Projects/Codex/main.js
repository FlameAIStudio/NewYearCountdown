const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");
const countdownEl = document.getElementById("countdown");
const titleEl = document.getElementById("title");
const startBtn = document.getElementById("startBtn");
const startPanel = document.querySelector(".start-panel");
const flashEl = document.getElementById("flash");

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const particles = [];
const textParticles = [];
let width = 0;
let height = 0;
let started = false;
let startTime = 0;
let countdown = 10;
let lastSecond = 10;
let audioReady = false;
let audioCtx = null;

const palette = [
  { color: "#f7d99c", weight: 35 },
  { color: "#fff2dc", weight: 20 },
  { color: "#ff6fcf", weight: 15 },
  { color: "#5fd9ff", weight: 15 },
  { color: "#a88bff", weight: 8 },
  { color: "#65ff8f", weight: 7 },
];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

resize();
window.addEventListener("resize", resize);

function weightedPick(list) {
  const total = list.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of list) {
    roll -= item.weight;
    if (roll <= 0) return item.color;
  }
  return list[list.length - 1].color;
}

function pickColors(maxColors = 3) {
  const colors = new Set();
  while (colors.size < maxColors) {
    colors.add(weightedPick(palette));
  }
  return Array.from(colors);
}

class Particle {
  constructor({ x, y, vx, vy, life, size, color, gravity = 0.02, drag = 0.985 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.remaining = life;
    this.size = size;
    this.color = color;
    this.gravity = gravity;
    this.drag = drag;
  }

  update(dt) {
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.remaining -= dt;
  }

  draw() {
    const alpha = Math.max(this.remaining / this.life, 0);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class TextParticle {
  constructor(x, y, tx, ty, color, size, persistent = false) {
    this.x = x;
    this.y = y;
    this.tx = tx;
    this.ty = ty;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.color = color;
    this.size = size;
    this.life = 400 + Math.random() * 200;
    this.persistent = persistent;
  }

  update(dt) {
    const ease = 0.04;
    this.vx += (this.tx - this.x) * ease;
    this.vy += (this.ty - this.y) * ease;
    this.vx *= 0.9;
    this.vy *= 0.9;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (!this.persistent) {
      this.life -= dt;
    }
  }

  draw() {
    const base = this.persistent ? 1 : Math.max(this.life / 400, 0);
    ctx.globalAlpha = base;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

function spawnRealBurst() {
  const x = width * (0.2 + Math.random() * 0.6);
  const y = height * (0.15 + Math.random() * 0.45);
  const colors = pickColors(2);
  const count = 90 + Math.floor(Math.random() * 50);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.6;
    particles.push(
      new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.9,
        life: 90 + Math.random() * 40,
        size: 1.5 + Math.random() * 2,
        color: colors[i % colors.length],
        gravity: 0.025 + Math.random() * 0.02,
      })
    );
  }
  particles.push(
    new Particle({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 30,
      size: 3.5,
      color: "#fff7e8",
      gravity: 0,
    })
  );
}

function spawnLayeredBurst() {
  const x = width * (0.2 + Math.random() * 0.6);
  const y = height * (0.1 + Math.random() * 0.45);
  const colors = pickColors(3);
  const rings = [
    { radius: 1.6, decay: 0.98 },
    { radius: 2.3, decay: 0.985 },
    { radius: 3.1, decay: 0.99 },
  ];
  rings.forEach((ring, index) => {
    const ringColor = colors[index % colors.length];
    const count = 40 + index * 20;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const speed = ring.radius + Math.random() * 0.6;
      particles.push(
        new Particle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 110 - index * 10 + Math.random() * 30,
          size: 1.2 + Math.random() * 1.6,
          color: ringColor,
          gravity: 0.02 + index * 0.005,
          drag: ring.decay,
        })
      );
    }
  });
}

function spawnSparklerRain() {
  const edge = Math.random();
  const x =
    edge < 0.5 ? Math.random() * width : Math.random() < 0.5 ? 0 : width;
  const y = edge < 0.5 ? 0 : Math.random() * height * 0.4;
  const count = 15 + Math.floor(Math.random() * 10);
  for (let i = 0; i < count; i += 1) {
    particles.push(
      new Particle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + Math.random() * 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 1.2 + Math.random() * 1.4,
        life: 160 + Math.random() * 80,
        size: 1 + Math.random() * 1.2,
        color: weightedPick(palette),
        gravity: 0.02,
        drag: 0.99,
      })
    );
  }
}

function spawnEmbers() {
  const x = Math.random() * width;
  const y = height * (0.4 + Math.random() * 0.6);
  particles.push(
    new Particle({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.6 - Math.random() * 0.6,
      life: 180 + Math.random() * 100,
      size: 0.8 + Math.random() * 0.6,
      color: "#fff6d9",
      gravity: -0.005,
      drag: 0.995,
    })
  );
}

function spawnCountdownSparks() {
  const rect = countdownEl.getBoundingClientRect();
  const count = 8;
  for (let i = 0; i < count; i += 1) {
    particles.push(
      new Particle({
        x: rect.left + rect.width * Math.random(),
        y: rect.top + rect.height * Math.random(),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        life: 40 + Math.random() * 40,
        size: 1.2 + Math.random() * 1,
        color: "#ffdca8",
        gravity: 0.015,
      })
    );
  }
}

function flash() {
  flashEl.style.opacity = "0.6";
  setTimeout(() => {
    flashEl.style.opacity = "0";
  }, 300);
}

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioReady = true;
}

function playThump(intensity = 0.6) {
  if (!audioReady) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 80 + intensity * 40;
  osc.type = "sine";
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.4 + intensity * 0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.start(now);
  osc.stop(now + 0.6);
}

function playSparkle() {
  if (!audioReady) return;
  const bufferSize = audioCtx.sampleRate * 0.2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.08;
  source.connect(filter).connect(gain).connect(audioCtx.destination);
  source.start();
}

function playFireworkCrackle(intensity = 0.7) {
  if (!audioReady) return;
  const duration = 0.5 + Math.random() * 0.5;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const decay = 1 - i / bufferSize;
    const snap = Math.random() < 0.015 ? 1 : 0.35;
    data[i] = (Math.random() * 2 - 1) * decay * decay * snap;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const band = audioCtx.createBiquadFilter();
  band.type = "bandpass";
  const startFreq = 380 + Math.random() * 1100;
  const endFreq = 260 + Math.random() * 900;
  band.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
  band.frequency.linearRampToValueAtTime(endFreq, audioCtx.currentTime + 0.35);
  band.Q.value = 0.5 + Math.random() * 0.4;
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1400 + Math.random() * 900;
  lowpass.Q.value = 0.7;
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 90 + Math.random() * 120;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.0001;
  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.12 * intensity, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.95);
  source
    .connect(band)
    .connect(lowpass)
    .connect(highpass)
    .connect(gain)
    .connect(audioCtx.destination);
  source.start(now);
  source.stop(now + duration);
}

function playCrackleBurst(durationMs = 2000, intervalMs = 180) {
  const start = performance.now();
  const timer = setInterval(() => {
    const base = 0.5 + Math.random() * 0.45;
    playFireworkCrackle(base);
    if (Math.random() < 0.35) {
      setTimeout(() => playFireworkCrackle(base * 0.6), 60 + Math.random() * 120);
    }
    if (performance.now() - start >= durationMs) {
      clearInterval(timer);
    }
  }, intervalMs + Math.random() * 80);
}

function playImpact() {
  playThump(1);
  if (!audioReady) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 40;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1);
  osc.start(now);
  osc.stop(now + 1.1);
}

function playBell() {
  if (!audioReady) return;
  const now = audioCtx.currentTime;
  const bellGain = audioCtx.createGain();
  bellGain.gain.value = 0.7;

  const base = 174;
  const partials = [
    { ratio: 1.0, gain: 0.62, decay: 6.2 },
    { ratio: 1.21, gain: 0.38, decay: 5.6 },
    { ratio: 1.49, gain: 0.3, decay: 5.0 },
    { ratio: 1.98, gain: 0.23, decay: 4.6 },
    { ratio: 2.53, gain: 0.18, decay: 4.2 },
    { ratio: 3.12, gain: 0.13, decay: 3.6 },
  ];

  partials.forEach((p) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    const startFreq = base * p.ratio;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.985, now + 0.6);
    osc.detune.value = (Math.random() - 0.5) * 8;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(bellGain);
    gain.gain.exponentialRampToValueAtTime(p.gain, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
    osc.start(now);
    osc.stop(now + p.decay + 0.3);
  });

  const strikeBufferSize = Math.floor(audioCtx.sampleRate * 0.15);
  const strikeBuffer = audioCtx.createBuffer(1, strikeBufferSize, audioCtx.sampleRate);
  const strikeData = strikeBuffer.getChannelData(0);
  for (let i = 0; i < strikeBufferSize; i += 1) {
    const decay = 1 - i / strikeBufferSize;
    strikeData[i] = (Math.random() * 2 - 1) * decay;
  }
  const strikeSource = audioCtx.createBufferSource();
  strikeSource.buffer = strikeBuffer;
  const strikeFilter = audioCtx.createBiquadFilter();
  strikeFilter.type = "bandpass";
  strikeFilter.frequency.value = 700;
  strikeFilter.Q.value = 1.2;
  const strikeGain = audioCtx.createGain();
  strikeGain.gain.value = 0.09;
  strikeSource.connect(strikeFilter).connect(strikeGain).connect(bellGain);
  strikeSource.start(now);

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1200;
  lowpass.Q.value = 0.7;

  const reverb = audioCtx.createDelay();
  reverb.delayTime.value = 0.26;
  const feedback = audioCtx.createGain();
  feedback.gain.value = 0.48;
  const reverbFilter = audioCtx.createBiquadFilter();
  reverbFilter.type = "lowpass";
  reverbFilter.frequency.value = 760;

  reverb.connect(reverbFilter).connect(feedback).connect(reverb);

  const wet = audioCtx.createGain();
  wet.gain.value = 0.55;
  const dry = audioCtx.createGain();
  dry.gain.value = 0.7;

  bellGain.connect(lowpass);
  lowpass.connect(dry).connect(audioCtx.destination);
  lowpass.connect(reverb).connect(wet).connect(audioCtx.destination);

  const thud = audioCtx.createOscillator();
  const thudGain = audioCtx.createGain();
  thud.type = "sine";
  thud.frequency.value = 90;
  thudGain.gain.value = 0.0001;
  thud.connect(thudGain).connect(audioCtx.destination);
  thudGain.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  thud.start(now);
  thud.stop(now + 0.6);
}

function updateCountdownVisual(value) {
  countdownEl.textContent = value;
  countdownEl.style.transform = "scale(1.05)";
  countdownEl.style.filter = "brightness(1.2)";
  setTimeout(() => {
    countdownEl.style.transform = "scale(1)";
    countdownEl.style.filter = "brightness(1)";
  }, 280);
  spawnCountdownSparks();
}

function createTextParticles(text, fontSize, yOffset, color, persistent = false) {
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");
  const font = `${fontSize}px Garamond`;
  offCtx.font = font;
  const metrics = offCtx.measureText(text);
  off.width = metrics.width + 20;
  off.height = fontSize + 20;
  offCtx.font = font;
  offCtx.fillStyle = "white";
  offCtx.fillText(text, 10, fontSize);
  const image = offCtx.getImageData(0, 0, off.width, off.height).data;
  for (let y = 0; y < off.height; y += 4) {
    for (let x = 0; x < off.width; x += 4) {
      const idx = (y * off.width + x) * 4;
      if (image[idx + 3] > 0) {
        const tx = width / 2 - off.width / 2 + x;
        const ty = height / 2 - off.height / 2 + y + yOffset;
        textParticles.push(
          new TextParticle(
            Math.random() * width,
            height + Math.random() * 60,
            tx,
            ty,
            color,
            2,
            persistent
          )
        );
      }
    }
  }
}

function scheduleCelebration() {
  setTimeout(() => {
    createTextParticles("2026", 140, -20, "#ffe2a8", true);
    playCrackleBurst(4200, 140);
  }, 0);
  setTimeout(() => {
    createTextParticles("HAPPY NEW YEAR", 48, 120, "#fff7ea", true);
    titleEl.textContent = "";
  }, 1000);
}

function timelineIntensity(secondsLeft) {
  if (secondsLeft >= 6) return 0.35;
  if (secondsLeft >= 3) return 0.6;
  if (secondsLeft >= 1) return 0.85;
  return 1;
}

function tickTimeline(now) {
  const elapsed = (now - startTime) / 1000;
  const secondsLeft = Math.max(0, 10 - Math.floor(elapsed));
  if (secondsLeft !== lastSecond && secondsLeft >= 0) {
    lastSecond = secondsLeft;
    if (secondsLeft > 0) {
      updateCountdownVisual(secondsLeft);
      playSparkle();
    } else {
      countdownEl.textContent = "";
      playBell();
      flash();
      scheduleCelebration();
      setTimeout(() => {
        for (let i = 0; i < 6; i += 1) {
          spawnRealBurst();
          spawnLayeredBurst();
        }
      }, 200);
    }
  }

  const intensity = timelineIntensity(secondsLeft);
  if (Math.random() < 0.05 + intensity * 0.05) spawnRealBurst();
  if (Math.random() < 0.03 + intensity * 0.05) spawnLayeredBurst();
  if (Math.random() < 0.08 + intensity * 0.08) spawnSparklerRain();
  if (Math.random() < 0.2) spawnEmbers();
}

function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  particles.forEach((p) => p.draw());
  ctx.globalCompositeOperation = "source-over";
  textParticles.forEach((p) => p.draw());
}

let lastFrame = performance.now();
function loop(now) {
  const dt = Math.min((now - lastFrame) / 16.67, 2);
  lastFrame = now;

  if (started) {
    tickTimeline(now);
  }

  particles.forEach((p) => p.update(dt));
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    if (particles[i].remaining <= 0) particles.splice(i, 1);
  }

  textParticles.forEach((p) => p.update(dt));
  for (let i = textParticles.length - 1; i >= 0; i -= 1) {
    if (!textParticles[i].persistent && textParticles[i].life <= 0) {
      textParticles.splice(i, 1);
    }
  }

  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

startBtn.addEventListener("click", () => {
  if (!started) {
    started = true;
    startTime = performance.now();
    countdown = 10;
    lastSecond = 10;
    if (!audioReady) initAudio();
    updateCountdownVisual(10);
    playSparkle();
  }
  startPanel.classList.add("fade-out");
  setTimeout(() => {
    startPanel.classList.add("hide");
  }, 600);
});
