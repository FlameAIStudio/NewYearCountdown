
import './style.css';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { Timeline } from './engine/Timeline.js';
import { AudioManager } from './audio/AudioManager.js';
import { TextManager } from './engine/TextManager.js';

// Application State
const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  ctx: null,
  particleSystem: null,
  textManager: null,
  timeline: null,
  audioManager: null,
  isRunning: false
};

// Initialization
function init() {
  const canvas = document.querySelector('#app-canvas');
  state.ctx = canvas.getContext('2d');

  // Set initial size
  resize();
  window.addEventListener('resize', resize);

  // Initialize systems
  state.audioManager = new AudioManager();
  state.particleSystem = new ParticleSystem(state.width, state.height);
  state.textManager = new TextManager(state.particleSystem);
  state.timeline = new Timeline(state.particleSystem, state.audioManager, state.textManager);

  // UI Handlers
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');

  startBtn.addEventListener('click', async () => {
    console.log("Start button clicked");
    try {
      await state.audioManager.init();
      console.log("Audio initialized");
      startOverlay.style.opacity = '0';
      setTimeout(() => {
        console.log("Removing overlay");
        startOverlay.remove();
      }, 500);
      state.isRunning = true;
      state.timeline.start();
      console.log("Timeline started");
      loop();
    } catch (e) {
      console.error("Initialization failed:", e);
    }
  });
}

// Resize Handler
function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  const canvas = document.querySelector('#app-canvas');
  canvas.width = state.width;
  canvas.height = state.height;
  if (state.particleSystem) state.particleSystem.resize(state.width, state.height);
  if (state.textManager) state.textManager.resize(state.width, state.height);
}

// Render Loop
function loop() {
  if (!state.isRunning) return;

  requestAnimationFrame(loop);

  // Clear screen with trail effect for "anti-gravity" feel/light trails if desired
  // For now, standard clear or low opacity black for trails
  state.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  state.ctx.fillRect(0, 0, state.width, state.height);

  // Update & Render
  state.timeline.update();
  state.particleSystem.update();
  state.particleSystem.render(state.ctx);
}

console.log("Main script loaded");
init();
