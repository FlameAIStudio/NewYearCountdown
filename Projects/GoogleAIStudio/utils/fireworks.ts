
import { Particle } from '../types';
import { COLORS, PHYSICS } from '../constants';

export const createBurst = (x: number, y: number, isMajor: boolean = false): Particle[] => {
  const particles: Particle[] = [];
  const count = isMajor ? 220 : 140;
  
  // Weights for non-white colorful distribution
  const getRandomColor = () => {
    const r = Math.random();
    if (r < 0.25) return COLORS.GOLD[Math.floor(Math.random() * COLORS.GOLD.length)];
    if (r < 0.45) return COLORS.PINK[Math.floor(Math.random() * COLORS.PINK.length)];
    if (r < 0.65) return COLORS.BLUE[Math.floor(Math.random() * COLORS.BLUE.length)];
    if (r < 0.85) return COLORS.ACCENT[Math.floor(Math.random() * COLORS.ACCENT.length)];
    return COLORS.RED[Math.floor(Math.random() * COLORS.RED.length)];
  };

  const mainColor = getRandomColor();
  const secondaryColor = getRandomColor();
  const coreColor = isMajor ? '#FFFD00' : '#00FFFF'; // Bright Yellow or Cyan for high energy instead of white

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * (isMajor ? 13 : 9) + 2;
    const isCore = Math.random() < (isMajor ? 0.25 : 0.15);
    const isSecondary = Math.random() < 0.4;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      alpha: 1,
      color: isCore ? coreColor : (isSecondary ? secondaryColor : mainColor),
      size: isCore ? 3.0 : Math.random() * 2.5 + 1.2,
      decay: Math.random() * 0.007 + 0.003,
      gravity: PHYSICS.GRAVITY * (isCore ? 0.45 : 0.8),
      friction: PHYSICS.FRICTION,
      type: isCore ? 'core' : 'burst',
    });
  }
  return particles;
};

export const createSparkle = (x: number, y: number, color: string): Particle => {
  // Sparkler sparks: Slightly wider spray with vibrant colors
  const angle = (Math.PI * 0.5) + (Math.random() - 0.5) * 1.5;
  const force = Math.random() * 6 + 2;
  return {
    x,
    y,
    vx: Math.cos(angle) * force,
    vy: Math.sin(angle) * force,
    alpha: 1,
    color: color === '#FFFFFF' ? '#FFD700' : color, // Ensure no white from sparks
    size: Math.random() * 2.2 + 0.6,
    decay: Math.random() * 0.025 + 0.012,
    gravity: PHYSICS.GRAVITY * 1.3,
    friction: 0.965,
    type: 'sparkle',
  };
};
