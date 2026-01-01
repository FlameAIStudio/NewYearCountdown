# 🎆Kiro — New Year Countdown🎆

A vibrant New Year countdown celebration with dynamic fireworks, sparklers, and synchronized sound effects.

![Preview](./Kiro-Preview.gif)
---

## ✨ Features

- **Interactive Countdown**: 10-second countdown with typewriter-style sound effects
- **Dynamic Fireworks**: Multiple firework types with rich color combinations (gold, white, pink, blue, purple, green, red, cyan)
- **Sparkler Effects**: Continuous sparkler trails for added visual depth
- **Audio Synthesis**: Real-time generated sound effects using Web Audio API
- **Smooth Animations**: Optimized particle system with up to 1500+ particles
- **Responsive Design**: Adapts to any screen size

---

## 🚀 How to Run

No build tools or dependencies required.

### Option 1: Direct Open
Simply open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local Server (Recommended)

**Using Python:**
```bash
python3 -m http.server
```

**Using Node.js:**
```bash
npx serve
```

Then open the URL shown in your terminal.

---

## 🎮 Usage

1. Open the page - you'll see background fireworks
2. Click the **"开始跨年倒计时"** (Start Countdown) button
3. Watch the 10-second countdown with escalating fireworks
4. Enjoy the grand finale celebration!

---

## 🎨 Technical Highlights

- **Pure Vanilla JavaScript** - No frameworks or libraries
- **Canvas API** - Hardware-accelerated rendering
- **Web Audio API** - Procedurally generated sound effects
  - Typewriter-style countdown beeps
  - Explosion sounds with noise synthesis
  - Bell-like celebration tones
- **Particle System** - Efficient particle management with configurable limits
- **Visual Effects**:
  - Screen shake on major explosions
  - Flash effects for dramatic moments
  - Smooth particle trails with alpha blending

---

## 🔧 Customization

Edit `fireworks.js` to customize:

```javascript
const CONFIG = {
    colors: {
        // Add your own color schemes
        gold: ['#FFD700', '#FFC125', '#DAA520', '#F4A460'],
        // ... more colors
    },
    maxParticles: 1500,  // Adjust particle limit
    maxFireworks: 35,    // Max simultaneous fireworks
    maxSparklers: 18     // Max sparkler trails
};
```

---

## 📝 Notes

- **Audio**: Requires user interaction (button click) to enable sound due to browser autoplay policies
- **Performance**: Optimized for modern browsers with requestAnimationFrame
- **Browser Support**: Works best in Chrome, Firefox, Safari, and Edge (latest versions)

---

## 🎉 Perfect For

- New Year celebrations
- Birthday countdowns
- Event launches
- Learning canvas animations
- Web Audio API experiments

---

## 📄 License

MIT License - Feel free to use, modify, and share!

---

**Happy New Year! 🎊**

---

Created by Flame (FlameAIStudio). See the repository root for author details and license.

