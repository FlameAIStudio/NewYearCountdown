
import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Particle } from '../types';
import { createBurst, createSparkle } from '../utils/fireworks';
import { COLORS, PHYSICS } from '../constants';

export interface FireworksHandle {
  trigger: (isMajor: boolean) => void;
}

interface Props {
  activeSparklers: boolean;
}

const FireworksCanvas = forwardRef<FireworksHandle, Props>(({ activeSparklers }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);

  // 暴露给父组件的命令式接口，避免重新渲染 App 组件
  useImperativeHandle(ref, () => ({
    trigger: (isMajor: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6;
      particlesRef.current.push(...createBurst(x, y, isMajor));
    }
  }));

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 6, 23, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';

    if (activeSparklers) {
      if (Math.random() < 0.3) {
        const x = Math.random() * canvas.width;
        const color = COLORS.GOLD[Math.floor(Math.random() * COLORS.GOLD.length)];
        particlesRef.current.push(createSparkle(x, -5, color));
      }
    }

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > canvas.height + 10) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      
      ctx.beginPath();
      const size = p.type === 'core' ? p.size * 1.5 : p.size;
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (particles.length > PHYSICS.MAX_PARTICLES) {
      particles.splice(0, particles.length - PHYSICS.MAX_PARTICLES);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [activeSparklers]);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', initCanvas);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate, initCanvas]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#020617' }} />;
});

export default FireworksCanvas;
