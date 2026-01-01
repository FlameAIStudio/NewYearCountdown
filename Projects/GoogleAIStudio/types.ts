
export type ParticleType = 'burst' | 'sparkle' | 'core' | 'star';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
  gravity: number;
  friction: number;
  type: ParticleType;
}

export interface Emitter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  type: 'sparkler' | 'fountain';
}

export type CountdownState = 'waiting' | 'preparing' | 'counting' | 'celebrating';
