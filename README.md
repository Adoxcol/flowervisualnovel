# Visual Novel: Letters to Simin 💌

A romantic interactive visual novel built with HTML5, CSS3, and JavaScript. Experience a heartfelt story through beautiful visuals, atmospheric music, and meaningful choices.

## 🎮 Game Overview

This visual novel tells the story of Mahmood's journey to reconnect with Simin through heartfelt letters and meaningful conversations. Players navigate through different scenes, make choices that affect the story, and ultimately discover beautiful love letters.

## ✨ Features

### 🎨 Visual & Audio
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Beautiful Backgrounds**: SVG-based scenes including cafe, garden, park, and evening settings
- **Character Portraits**: Dynamic character positioning with smooth animations
- **Atmospheric Music**: Background music that adapts to different scenes
- **Smooth Transitions**: Elegant scene transitions and character animations

### 📖 Interactive Story
- **Branching Narrative**: Player choices influence the story progression
- **Typewriter Effect**: Text appears letter-by-letter for immersive reading
- **Multiple Endings**: Different story paths based on player decisions
- **Love Letters**: Full-screen letter display with extended dialogue boxes
- **Character Development**: Deep emotional storytelling with meaningful dialogue

### 🎵 Audio System
- **Background Music**: Contextual music for different moods (peaceful, gentle, romantic, cozy, tense)
- **Music Controls**: Volume adjustment and mute/unmute functionality
- **Smooth Transitions**: Fade in/out effects between music tracks
- **Audio Optimization**: Efficient loading and playback management

### 📱 Cross-Platform Support
- **Desktop Optimization**: Full keyboard and mouse support
- **Mobile Responsive**: Touch-friendly interface with swipe gestures
- **Tablet Support**: Optimized layouts for medium-sized screens
- **Landscape Mode**: Special handling for landscape orientation

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for audio file support)

### Installation & Setup

1. **Clone or Download** the project files
2. **Start a Local Server**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open in Browser**: Navigate to `http://localhost:8000`

## 📁 Project Structure

```
flowergame/
├── index.html              # Main HTML structure
├── styles.css              # Responsive CSS styling
├── visual-novel.js         # Core game logic and story engine
├── audio/                  # Background music files
│   ├── peaceful.mp3        # Calm, peaceful scenes
│   ├── gentle.mp3          # Gentle, emotional moments
│   ├── romantic.mp3        # Romantic scenes
│   ├── cozy.mp3           # Cozy, intimate settings
│   └── tense.mp3          # Dramatic moments
├── backgrounds/            # SVG background images
│   ├── cafe.svg           # Coffee shop setting
│   ├── garden.svg         # Garden scene
│   ├── park.svg           # Park environment
│   └── evening.svg        # Evening/sunset scene
├── character.png           # Female character portrait
├── guy.png                # Male character portrait
├── staring.png            # Alternative character expression
└── README.md              # This documentation
```

## 🎯 Game Controls

### Desktop
- **Space/Enter**: Advance dialogue
- **Mouse Click**: Advance dialogue or select choices
- **Escape**: Open settings menu

### Mobile/Tablet
- **Tap**: Advance dialogue or select choices
- **Swipe**: Navigate through scenes (where applicable)
- **Touch & Hold**: Access settings

## 🛠️ Customization Guide

### Adding New Scenes

1. **Update the Story Data** in `visual-novel.js`:
```javascript
scenes: {
    newScene: {
        background: 'garden',
        music: 'peaceful',
        characters: {
            left: 'character.png',
            right: 'guy.png'
        },
        dialogue: [
            {
                speaker: 'Character Name',
                text: 'Your dialogue here...',
                choices: [
                    { text: 'Choice 1', next: 'scene1' },
                    { text: 'Choice 2', next: 'scene2' }
                ]
            }
        ]
    }
}
```

### Adding New Music

1. **Add Audio Files** to the `audio/` folder
2. **Update the Music System** in `visual-novel.js`:
```javascript
playMusic(musicName) {
    const musicFiles = {
        newTrack: 'audio/newtrack.mp3'
    };
    // Music loading logic
}
```

### Creating New Backgrounds

1. **Create SVG Files** in the `backgrounds/` folder
2. **Update Background System** in `visual-novel.js`:
```javascript
setBackground(backgroundType) {
    const backgrounds = {
        newBackground: 'backgrounds/newbg.svg'
    };
    // Background loading logic
}
```

### Adding Character Expressions

1. **Add Image Files** to the project root
2. **Reference in Story Data**:
```javascript
characters: {
    left: 'character-happy.png',
    right: 'guy-sad.png'
}
```

## 🎨 Responsive Design

The visual novel automatically adapts to different screen sizes:

- **Desktop (1025px+)**: Full-featured layout with large character portraits
- **Tablet (769px-1024px)**: Optimized for touch interaction
- **Mobile (481px-768px)**: Compact layout with touch-friendly controls
- **Small Mobile (≤480px)**: Minimal interface for small screens
- **Landscape Mode**: Special handling for horizontal orientation

## 🔧 Technical Features

### Performance Optimizations
- **Efficient DOM Manipulation**: Minimal reflows and repaints
- **Image Preloading**: Smooth transitions between scenes
- **Memory Management**: Proper cleanup of audio and visual resources
- **Touch Optimization**: Responsive touch events with proper debouncing

### Browser Compatibility
- **Modern Browsers**: Full ES6+ support required
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 70+
- **Audio Support**: MP3 format for maximum compatibility
- **SVG Support**: Vector graphics for crisp visuals at any size

## 🚀 Deployment Options

### Static Hosting Platforms
- **Netlify**: Drag-and-drop deployment with automatic HTTPS
- **Vercel**: Git-based deployment with preview URLs
- **GitHub Pages**: Free hosting for public repositories
- **Render**: Static site hosting with custom domains

### Deployment Steps (Netlify Example)
1. Zip your project files
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop your zip file
4. Get your live URL instantly

## 🎭 Story Structure

The visual novel follows this narrative flow:

1. **Introduction**: Meet the characters and establish the setting
2. **Development**: Player choices shape the relationship dynamics
3. **Climax**: Emotional peak with meaningful decisions
4. **Resolution**: Love letters reveal the depth of feelings
5. **Conclusion**: Restart option to explore different paths

## 🔮 Future Enhancements

### Planned Features
- **Save System**: Allow players to save progress
- **Multiple Story Paths**: Expand branching narrative options
- **Character Customization**: Different outfits and expressions
- **Voice Acting**: Add voice narration for key scenes
- **Achievements**: Unlock system for different story outcomes

### Technical Improvements
- **Progressive Web App**: Offline support and app-like experience
- **Accessibility**: Screen reader support and keyboard navigation
- **Internationalization**: Multi-language support
- **Analytics**: Track player choices and engagement

## 📄 License

This project is open source and available under the MIT License. Feel free to modify, distribute, and use for your own visual novel projects.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional story content
- New character expressions
- Background artwork
- Music compositions
- Code optimizations
- Bug fixes

## 📞 Support

For questions, suggestions, or issues:
- Check the browser console for error messages
- Ensure you're running on a local server for audio support
- Verify all asset files are properly loaded
- Test on different devices and browsers

---

**Enjoy the journey through this heartfelt visual novel! 💕**

*Experience the power of love, choice, and beautiful storytelling.*