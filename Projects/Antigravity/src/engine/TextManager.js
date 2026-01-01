
export class TextManager {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.width = particleSystem.width;
        this.height = particleSystem.height;

        // Offscreen canvas for sampling
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.currentText = null;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }

    // Generate particles for a string
    createNumber(text, scale = 1.0) {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.clearRect(0, 0, this.width, this.height);

        const fontSize = Math.min(this.width, this.height) * 0.4 * scale;
        this.ctx.font = `900 ${fontSize}px "Inter", "Arial Black", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';

        this.ctx.fillText(text, this.width / 2, this.height / 2);

        this.sampleAndCreateParticles(text);
    }

    createFinaleText() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Multi-line
        const fontSize = Math.min(this.width, this.height) * 0.15;
        this.ctx.font = `900 ${fontSize}px "Inter", "Arial Black", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';

        this.ctx.fillText("HAPPY", this.width / 2, this.height * 0.4);
        this.ctx.fillText("NEW YEAR", this.width / 2, this.height * 0.55);
        this.ctx.fillText("2026", this.width / 2, this.height * 0.75);

        this.sampleAndCreateParticles('FINALE', true);
    }

    sampleAndCreateParticles(identifier, isFinale = false) {
        const id = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = id.data;
        const step = isFinale ? 6 : 8; // Density

        const particles = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let y = 0; y < this.height; y += step) {
            for (let x = 0; x < this.width; x += step) {
                const alpha = data[(y * this.width + x) * 4 + 3];
                if (alpha > 128) {
                    // Text Particle
                    // Calculation for Metallic look:
                    // We want a gradient based on Y or distance from center
                    // Gold/Silver gradient

                    const isGold = Math.random() > 0.5;
                    const color = isGold
                        ? `hsl(45, 100%, ${40 + Math.random() * 15}%)`
                        : `hsl(${180 + Math.random() * 140}, 100%, ${45 + Math.random() * 10}%)`; // Saturated Cyan to Magenta

                    // Add some sparkler particles on edges
                    // For now, standard text particles
                    particles.push({
                        x: x,
                        y: y,
                        color: color
                    });
                }
            }
        }

        // Send to System
        // We need a specific method in ParticleSystem to handle these "Text Particles" 
        // which might behave differently (static then disperse? or just explode in?)
        // User Requirement: "Digital material: Metal + Particle edges, numbers slightly scale up"
        // So they should exist as particles that hold shape for 1 sec then die or fall.

        this.particleSystem.spawnTextParticles(particles, isFinale);
    }
}
