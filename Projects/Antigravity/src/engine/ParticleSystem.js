
import { FireworkTypes } from './FireworkTypes.js';

class Particle {
    constructor(x, y, color, velocity, life, properties = {}) {
        this.x = x;
        this.y = y;
        this.color = color; // Expecting HSLA string or object
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.life = life;
        this.maxLife = life;
        this.alpha = 1;
        this.gravity = (properties.gravity !== undefined) ? properties.gravity : 0.15; // fix bug where 0 becomes 0.15
        this.drag = properties.drag || 0.98;
        this.decay = properties.decay || 0.015;
        this.size = properties.size || 2;
        this.shimmer = properties.shimmer || false;
        this.trail = properties.trail || false;
        this.history = []; // For trails
    }

    update() {
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.life !== Infinity) {
            this.life -= this.decay * 60;
            this.alpha = Math.max(0, this.life / this.maxLife);
        }

        if (this.properties && this.properties.isText && this.life !== Infinity) {
            // Expansion effect: Zoom in and expand over time
            const progress = 1 - (this.life / this.maxLife); // 0 to 1
            const scale = 1 + progress * 2.5; // Scale from 1.0 to 3.5

            // Move outwards from their original position to create a "zoom" effect
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            // Adjust position based on scale from center
            // originalX/Y were stored in spawnTextParticles
            if (this.properties.originalX !== undefined) {
                const dx = this.properties.originalX - cx;
                const dy = this.properties.originalY - cy;
                this.x = cx + dx * scale;
                this.y = cy + dy * scale;
            }

            // Also grow the particle size slightly for more "punch"
            this.size = (this.properties.size || 2) * (1 + progress * 1.5);

            this.alpha = Math.min(1, (this.life / this.maxLife) * 4); // Sharper fade at the end
        }

        if (this.trail) {
            this.history.push({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.history.length > 5) this.history.shift();
        }
    }

    render(ctx) {
        if (this.alpha <= 0) return;

        ctx.save();

        // Draw Trail
        if (this.trail && this.history.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = this.color.replace(')', `, ${this.alpha * 0.5})`).replace('hsl', 'hsla');
            ctx.lineWidth = this.size * 0.5;
            ctx.stroke();
        }

        // Draw Particle
        ctx.globalAlpha = this.alpha;

        // Shimmer effect
        if (this.shimmer && Math.random() > 0.8) {
            ctx.globalAlpha = this.alpha * 0.5;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class ParticleSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.particles = [];
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    // Define types of Fireworks here or delegate
    spawnFirework(x, startY, type = 'REAL') {
        // Launch particle (rising)
        // For now, let's just cheat and spawn the explosion at a random height 
        // or simulate a rocket. Let's do instant explosion for the "Countdown" vibe 
        // or a rocket if it is a "Timed" one.
        // User asked for "Real Burst" which usually implies the whole shell.
        // Let's spawn the explosion directly for better control of the countdown timing.

        const targetY = startY || (this.height * 0.2 + Math.random() * (this.height * 0.4));
        this.createExplosion(x, targetY, type);
    }

    createExplosion(x, y, typeName) {
        const config = FireworkTypes[typeName] || FireworkTypes['REAL'];
        const particlesCount = config.particles;
        const baseColor = config.getColor(); // Should return a color string

        // Create particles based on type
        for (let i = 0; i < particlesCount; i++) {
            const p = config.generator(x, y, i, particlesCount, baseColor);
            this.particles.push(new Particle(
                p.x, p.y,
                p.color,
                p.velocity,
                p.life,
                p.properties
            ));
        }
    }

    createTextParticles(points) {
        // Intended for the numbers/text formation
        // points: [{x, y}]
        points.forEach(pt => {
            this.particles.push(new Particle(
                pt.x, pt.y,
                'hsl(45, 100%, 70%)',
                { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5 },
                60, // frames
                { gravity: 0, drag: 0.9, size: 1.5, shimmer: true }
            ));
        });
    }

    spawnTextParticles(points, isFinale = false) {
        // Clear old text particles if any (optional, or let them fade)
        // Actually, for countdown 10->1, we probably want to clear previous number or let it fall

        const life = isFinale ? Infinity : 70; // 1s + buffer

        points.forEach(pt => {
            this.particles.push(new Particle(
                pt.x, pt.y,
                pt.color,
                { x: 0, y: 0 }, // Static initially
                life,
                {
                    gravity: 0, // Text stays static
                    drag: 0.9,
                    size: isFinale ? 2 : 3,
                    shimmer: true,
                    isText: true,
                    // Expansion effect for "breathing"
                    originalX: pt.x,
                    originalY: pt.y
                }
            ));
        });
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.alpha <= 0 || p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Composite operation 'lighter' creates that nice glow overlap
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => p.render(ctx));
        ctx.globalCompositeOperation = 'source-over';
    }
}
