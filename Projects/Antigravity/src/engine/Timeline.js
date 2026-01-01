
export class Timeline {
    constructor(particleSystem, audioManager, textManager) {
        this.particleSystem = particleSystem;
        this.audioManager = audioManager;
        this.textManager = textManager;

        // Config
        this.countdownStart = 10;
        this.currentTime = 11; // Buffer
        this.startTime = 0;
        this.hasStarted = false;

        this.lastSecond = 11;
    }

    start() {
        this.startTime = performance.now();
        this.hasStarted = true;
        this.audioManager.playAmbient();
    }

    update() {
        if (!this.hasStarted) return;

        // Calculate countdown time
        // We want to sync exactly with seconds.
        const now = performance.now();
        const elapsed = (now - this.startTime) / 1000;
        const remaining = Math.max(0, this.countdownStart - elapsed + 1); // +1 because we say "Ten" at 10.0, and "Zero" at 0.0

        const currentInt = Math.floor(remaining);

        // Second Change Trigger
        if (currentInt < this.lastSecond) {
            this.onSecondTick(currentInt);
            this.lastSecond = currentInt;
        }

        // Continuous updates based on phase
        this.updatePhase(remaining);
    }

    onSecondTick(second) {
        if (second >= 1 && second <= 10) {
            // Play VO
            this.audioManager.playCount(second);
            // Show Text
            this.textManager.createNumber(second.toString());
        }

        // Visual Pulse or specific effects per second
        if (second === 0) {
            this.triggerFinale();
            this.audioManager.playSfx('IMPACT_ZERO');
        }
    }

    updatePhase(time) {
        // time is e.g. 9.5 (9.5 seconds left)

        // Random firework spawner logic - Increased density
        if (time > 0) {
            // Increased probability from 0.02 to 0.05
            if (Math.random() < 0.05) {
                this.spawnAmbientFirework(time);
            }
        } else {
            // Finale loop - Continuous and more intense celebration
            // Increased probability from 0.15 to 0.25
            if (Math.random() < 0.25) {
                this.spawnFinaleFirework();
            }
        }
    }

    spawnAmbientFirework(time) {
        const w = this.particleSystem.width;
        const h = this.particleSystem.height;

        let type = 'REAL';
        // Phase Logic
        // 10 -> 6: Calm, sparse
        if (time > 6) {
            if (Math.random() > 0.7) type = 'STARS';
        }
        // 5 -> 3: Expectation
        else if (time > 3) {
            type = Math.random() > 0.5 ? 'LAYERED' : 'REAL';
        }
        // 2 -> 1: Emotion
        else {
            type = 'RAIN'; // Sparklers
        }

        const x = w * 0.2 + Math.random() * w * 0.6;
        const y = h * 0.1 + Math.random() * h * 0.4;

        this.particleSystem.spawnFirework(x, y, type);
        this.audioManager.playSfx('FIREWORK_REAL'); // Generic crunch
    }

    spawnFinaleFirework() {
        const w = this.particleSystem.width;
        const h = this.particleSystem.height;
        const types = ['REAL', 'LAYERED', 'RAIN'];
        const type = types[Math.floor(Math.random() * types.length)];

        const x = Math.random() * w;
        const y = Math.random() * h * 0.5;

        this.particleSystem.spawnFirework(x, y, type);
        this.audioManager.playSfx('FIREWORK_REAL');
    }

    triggerFinale() {
        // Big white flash
        // Then massive barrage
        console.log("HAPPY NEW YEAR");

        this.textManager.createFinaleText();

        // Instant multiple bursts
        for (let i = 0; i < 5; i++) {
            this.spawnFinaleFirework();
        }
    }
}
