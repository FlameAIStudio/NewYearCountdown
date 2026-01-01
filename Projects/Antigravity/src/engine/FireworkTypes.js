
// Color Palettes
const COLORS = {
    GOLD: ['hsl(45, 100%, 45%)', 'hsl(35, 100%, 50%)', 'hsl(50, 100%, 40%)'],
    PINK: ['hsl(330, 100%, 50%)', 'hsl(300, 100%, 45%)'],
    BLUE: ['hsl(200, 100%, 50%)', 'hsl(220, 100%, 45%)'],
    MIXED: ['hsl(330, 100%, 50%)', 'hsl(200, 100%, 50%)', 'hsl(45, 100%, 45%)']
};

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const FireworkTypes = {
    // Type A: Real Burst (Round, heavy gravity, fast start)
    REAL: {
        particles: 150,
        getColor: () => randomPick([...COLORS.GOLD, ...COLORS.PINK, ...COLORS.BLUE]),
        generator: (x, y, i, count, color) => {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            return {
                x: x,
                y: y,
                color: color,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life: 80 + Math.random() * 20,
                properties: {
                    gravity: 0.15,
                    drag: 0.95,
                    decay: 0.01,
                    size: 2.5,
                    trail: true
                }
            };
        }
    },

    // Type B: Layered (Multiple colors, specific rings)
    LAYERED: {
        particles: 200,
        getColor: () => 'multi',
        generator: (x, y, i, count, baseColor) => {
            const layer = i % 3;
            const angle = (i / count) * Math.PI * 2 * 3;

            let speed, col;
            if (layer === 0) {
                speed = 2 + Math.random();
                col = COLORS.GOLD[0];
            } else if (layer === 1) {
                speed = 4 + Math.random();
                col = randomPick([...COLORS.PINK, ...COLORS.BLUE]);
            } else {
                speed = 7 + Math.random();
                col = randomPick(COLORS.MIXED);
            }

            return {
                x: x,
                y: y,
                color: col,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life: 100,
                properties: {
                    gravity: 0.1,
                    drag: 0.96,
                    size: 2,
                    trail: false
                }
            };
        }
    },

    // Type C: Sparkler / Rain (Streams down, long glitter)
    RAIN: {
        particles: 80,
        getColor: () => COLORS.GOLD[0],
        generator: (x, y, i, count, color) => {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
            const speed = Math.random() * 5 + 5;
            return {
                x: x,
                y: y,
                color: color,
                velocity: {
                    x: Math.cos(angle) * speed * 0.5,
                    y: Math.sin(angle) * speed
                },
                life: 120,
                properties: {
                    gravity: 0.25,
                    drag: 0.92,
                    decay: 0.005,
                    size: 1.5,
                    trail: true,
                    shimmer: true
                }
            };
        }
    }
};
