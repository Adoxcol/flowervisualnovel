# Flower Chase Game 🌸

A cute pixelated browser game where "she" chases "you" while answering questions correctly to get closer!

## How to Play

1. **Objective**: Help "her" catch "you" by answering questions correctly
2. **Controls**: 
   - **Desktop**: Press `Space` or `↑` to jump over obstacles
   - **Mobile**: Tap the jump button or tap anywhere on the game area
3. **Winning**: Answer 6 questions correctly to catch up and win
4. **Losing**: Get 4 questions wrong and lose the chase
5. **Obstacles**: Jump over puddles and blocks to avoid falling behind

## Game Features

### ✅ Implemented Features
- **Responsive Design**: Works on desktop and mobile browsers
- **Pixelated Graphics**: Retro game aesthetic with pixel-perfect rendering
- **Question System**: Random questions from a customizable question bank
- **Character Movement**: Automatic running with jump mechanics
- **Obstacle System**: Puddles and blocks that require jumping
- **Visual Effects**: Rain animation, flowers, and particle effects
- **Game States**: Start screen, gameplay, question popups, and end screen
- **Touch Controls**: Mobile-friendly jump button and touch input
- **Distance System**: Visual feedback showing how close the chaser is

### 🎮 Game Mechanics
- Questions appear every 8 seconds during gameplay
- Correct answers reduce distance by 15%
- Wrong answers increase distance by 10%
- Hitting obstacles increases distance by 5%
- Distance bar shows current progress (green = closer, red = farther)

## File Structure

```
flowergame/
├── index.html          # Main HTML file with game structure
├── styles.css          # Pixel art styling and responsive design
├── game.js             # Main game logic and mechanics
├── questions.js        # Question bank and question management
└── README.md           # This file
```

## Customization Guide

### Adding More Questions

Edit `questions.js` to add more questions to the `QUESTION_BANK` array:

```javascript
{
    question: "Your question here?",
    answers: ["Option A", "Option B", "Option C", "Option D"],
    correct: 1  // Index of correct answer (0-3)
}
```

### Adding Music and Sound Effects

1. Create an `assets/` folder with subfolders:
   ```
   assets/
   ├── music/
   │   └── background.mp3
   └── sounds/
       ├── correct.mp3
       ├── wrong.mp3
       └── jump.mp3
   ```

2. Uncomment the audio source tags in `index.html`
3. Uncomment the `playSound()` calls in `game.js`
4. Add this function to `game.js`:
   ```javascript
   playSound(soundName) {
       const audio = document.getElementById(soundName + 'Sound');
       if (audio) {
           audio.currentTime = 0;
           audio.play().catch(e => console.log('Audio play failed:', e));
       }
   }
   ```

### Improving Character Sprites

Replace the simple rectangle characters with actual pixel art:

1. Create 32x32 pixel sprites for characters
2. Load them as images in the game
3. Replace the `fillRect()` calls in the `draw()` method with `drawImage()`

Example:
```javascript
// In constructor, load images
this.playerSprite = new Image();
this.playerSprite.src = 'assets/sprites/player.png';

// In draw method, replace fillRect with:
this.ctx.drawImage(this.playerSprite, this.player.x, this.player.y);
```

### Adding More Obstacle Types

In `game.js`, modify the `spawnObstacle()` function:

```javascript
spawnObstacle() {
    const obstacleTypes = ['puddle', 'block', 'flower', 'rock'];
    const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    this.obstacles.push({
        x: this.canvas.width,
        y: this.canvas.height - 80,
        width: 30,
        height: 30,
        type: randomType
    });
}
```

### Enhancing Visual Effects

1. **Better Rain**: Add varying raindrop sizes and speeds
2. **Particle Systems**: Expand the particle system for more effects
3. **Background Parallax**: Add moving background layers
4. **Character Animations**: Add walking/running animation frames

### Game Balance Tweaks

Modify these constants in `game.js`:

```javascript
this.WINNING_CORRECT = 6;        // Questions needed to win
this.LOSING_WRONG = 4;           // Wrong answers before losing
this.QUESTION_INTERVAL = 8000;   // Time between questions (ms)
```

### Mobile Optimization

The game is already mobile-friendly, but you can enhance it further:

1. Add haptic feedback for mobile devices
2. Implement swipe gestures for jumping
3. Add orientation lock for landscape mode
4. Optimize touch target sizes

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Requirements**: HTML5 Canvas support, ES6 JavaScript

## Development Tips

1. **Testing**: Use browser developer tools to test on different screen sizes
2. **Performance**: Monitor frame rate with `performance.now()` for optimization
3. **Debugging**: Add console logs to track game state changes
4. **Assets**: Keep image files small for faster loading

## Future Enhancement Ideas

- **Power-ups**: Special items that give temporary advantages
- **Multiple Levels**: Different environments and difficulty levels
- **Leaderboard**: Track high scores and best times
- **Multiplayer**: Real-time competition between players
- **Story Mode**: Progressive difficulty with narrative elements
- **Character Customization**: Different character skins and outfits

## License

This is a starter project template. Feel free to modify and expand it for your own use!

---

Have fun expanding your Flower Chase game! 🎮🌸