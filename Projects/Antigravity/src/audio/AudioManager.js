
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.fileMap = {
            'Ambience': 'SFX_AMBIENCE_NIGHT.wav',
            'Impact': 'SFX_IMPACT_ZERO.wav',
            'Firework': 'SFX_FIREWORK_REAL.wav',
            // We will construct VO paths dynamically or map them
        };
    }

    async init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Try to load assets, but don't block if missing (use dummy)
        console.log("Audio Context Initialized");
    }

    playAmbient() {
        if (!this.ctx) return;
        // Placeholder: Low drone
        this.createOscillator(50, 'sine', 0.1, 10);
    }

    playCount(number) {
        if (!this.ctx) return;
        console.log(`[Audio] Playing: ${number}`);

        // Simulating Mechanical Keyboard "Click"
        // 1. High frequency click (transient)
        this.createOscillator(1200, 'square', 0.1, 0.05);
        // 2. Low frequency thud
        this.createOscillator(150, 'sine', 0.2, 0.1);
    }

    playSfx(type) {
        if (!this.ctx) return;

        if (type === 'FIREWORK_REAL') {
            // "Firecracker" type sound: Sharp, percussive snaps
            // We'll trigger 2-3 mini-snaps for a "crunchy" feel
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.createFirecrackerSnap(0.1);
                }, i * 40);
            }
        } else if (type === 'IMPACT_ZERO') {
            // Majestic Bell Sound (钟声)
            this.createBell(110); // Low resonant base
            this.createBell(220); // Harmonics
            this.createBell(330);
            this.createFirecrackerSnap(0.5); // Add a little sparkle
        }
    }

    // -- Generators for specific simulated sounds --

    createBell(freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle'; // triangle has fewer harmonics, sounds more "pure" like a bell's core
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Add a second harmonic for that metal ring
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);

        gain.connect(this.ctx.destination);
        osc.connect(gain);
        osc2.connect(gain);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.05); // Sharp attack
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4); // Long decay

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 4);
        osc2.stop(now + 4);
    }

    createFirecrackerSnap(duration) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            // Shaped noise for a "crack" rather than "hiss"
            const envelope = Math.pow(1 - i / bufferSize, 4); // Fast decay
            data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3000; // Take out the "harsh" hiss

        const gain = this.ctx.createGain();
        gain.gain.value = 0.3;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    createOscillator(freq, type, vol, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    }
}
