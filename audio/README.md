# Audio Files for Flower Garden Visual Novel

This directory should contain the background music files for each scene. The game expects the following audio files:

## Required Music Files

### 1. Peaceful Music (`peaceful.mp3` / `peaceful.ogg`)
- **Scene:** Garden Meeting (Scene 1)
- **Mood:** Calm, serene, nature-inspired
- **Suggested style:** Soft acoustic guitar, gentle piano, nature sounds

### 2. Gentle Music (`gentle.mp3` / `gentle.ogg`)
- **Scene:** Music & Common Interests (Scene 2)
- **Mood:** Warm, friendly, uplifting
- **Suggested style:** Light indie folk, soft strings, warm tones

### 3. Cozy Music (`cozy.mp3` / `cozy.ogg`)
- **Scene:** Café (Scene 3)
- **Mood:** Intimate, comfortable, romantic
- **Suggested style:** Jazz café ambiance, soft piano, warm atmosphere

### 4. Tense Music (`tense.mp3` / `tense.ogg`)
- **Scene:** Rocky Moment (Scene 4)
- **Mood:** Uncertain, emotional, contemplative
- **Suggested style:** Minor keys, subtle tension, emotional depth

### 5. Romantic Music (`romantic.mp3` / `romantic.ogg`)
- **Scene:** Romantic Night Walk (Scene 5)
- **Mood:** Romantic, dreamy, heartfelt
- **Suggested style:** Soft orchestral, romantic piano, gentle strings

## File Format Requirements

- **Primary format:** MP3 (for broad compatibility)
- **Fallback format:** OGG (for web compatibility)
- **Loop:** All tracks should be seamless loops
- **Volume:** Normalized to prevent sudden volume changes
- **Duration:** 2-5 minutes recommended for looping

## Audio Sources

You can find royalty-free music from:
- Freesound.org
- Zapsplat.com
- YouTube Audio Library
- Incompetech.com
- Pixabay Music

## Implementation Notes

The audio system includes:
- Automatic looping
- Fade in/out transitions
- Volume control
- Music toggle functionality
- Graceful fallback for missing files

If audio files are missing, the game will continue to work but without background music.