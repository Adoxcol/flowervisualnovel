// Visual Novel Game Engine - Fixed Version
class VisualNovel {
    constructor() {
        this.currentScene = 0;
        this.currentDialogue = 0;
        this.currentTypewriterInterval = null;
        this.isProcessing = false;
        this.isWaitingForChoice = false; // New flag to track choice state
        this.gameState = {
            playerName: "Simin",
            guyName: "Mahmood",
            relationship: 0,
            flags: {}
        };

        // Background preloading system
        this.backgroundCache = new Map();
        this.backgroundsLoaded = false;
        this.loadingProgress = 0;
        this.backgroundUrls = {
            garden: 'backgrounds/garden.svg',
            cafe: 'backgrounds/cafe.svg',
            park: 'backgrounds/park.svg',
            evening: 'backgrounds/evening.svg'
        };

        // DOM elements
        this.titleScreen = document.getElementById('title-screen');
        this.background = document.getElementById('background');
        this.characterLeft = document.getElementById('character-left');
        this.characterRight = document.getElementById('character-right');
        this.dialogueBox = document.getElementById('dialogue-box');
        this.characterName = document.getElementById('character-name');
        this.dialogueText = document.getElementById('dialogue-text');
        this.continueIndicator = document.getElementById('continue-indicator');
        this.choiceContainer = document.getElementById('choice-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.getElementById('loading-progress');
        this.loadingText = document.getElementById('loading-text');

        // Audio system
        this.currentMusic = null;
        this.musicVolume = 0.4;
        this.isMusicEnabled = true;

        // Initialize
        this.setupEventListeners();
        this.loadStory();
        this.showLoadingScreen();
        this.preloadBackgrounds();
    }

    setupEventListeners() {
        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Button event listeners with touch support
        this.addTouchAndClickListener('start-btn', () => this.startGame());
        this.addTouchAndClickListener('continue-btn', () => this.continueGame());
        this.addTouchAndClickListener('save-btn', () => this.saveGame());
        this.addTouchAndClickListener('load-btn', () => this.loadGame());
        this.addTouchAndClickListener('settings-btn', () => this.showSettings());
        
        // Enhanced dialogue box interaction with touch support
        if (this.dialogueBox) {
            this.addTouchAndClickListener(this.dialogueBox, () => {
                if (this.canAdvanceDialogue()) {
                    this.nextDialogue();
                }
            });
        }
        
        // Swipe gestures for mobile
        if (this.isTouch) {
            this.setupSwipeGestures();
        }
        
        // Keyboard handler (for desktop)
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && this.canAdvanceDialogue()) {
                e.preventDefault();
                this.nextDialogue();
            }
            
            // Music controls
            if (e.key.toLowerCase() === 'm') {
                e.preventDefault();
                const isEnabled = this.toggleMusic();
                console.log(`Music ${isEnabled ? 'enabled' : 'disabled'}`);
            }
            
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                const newVolume = Math.min(1, this.musicVolume + 0.1);
                this.setMusicVolume(newVolume);
                console.log(`Volume: ${Math.round(newVolume * 100)}%`);
            }
            
            if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                const newVolume = Math.max(0, this.musicVolume - 0.1);
                this.setMusicVolume(newVolume);
                console.log(`Volume: ${Math.round(newVolume * 100)}%`);
            }
        });

        // Prevent double-tap zoom on mobile
        if (this.isMobile) {
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle resize for responsive adjustments
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    // Enhanced event listener that supports both touch and click
    addTouchAndClickListener(element, callback) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;

        if (this.isTouch) {
            // Touch events for mobile
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                element.classList.add('active');
            }, { passive: false });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                element.classList.remove('active');
                callback();
            }, { passive: false });
            
            element.addEventListener('touchcancel', (e) => {
                element.classList.remove('active');
            });
        } else {
            // Click events for desktop
            element.addEventListener('click', callback);
        }
    }

    // Setup swipe gestures for mobile navigation
    setupSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50;
            
            // Horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe right - could be used for going back
                    this.handleSwipeRight();
                } else {
                    // Swipe left - could be used for advancing
                    this.handleSwipeLeft();
                }
            }
            
            // Vertical swipes
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    // Swipe down - could show menu
                    this.handleSwipeDown();
                } else {
                    // Swipe up - could hide menu
                    this.handleSwipeUp();
                }
            }
        }, { passive: true });
    }

    // Swipe gesture handlers
    handleSwipeLeft() {
        if (this.canAdvanceDialogue()) {
            this.nextDialogue();
        }
    }

    handleSwipeRight() {
        // Could implement going back functionality
        // For now, just advance dialogue like tap
        if (this.canAdvanceDialogue()) {
            this.nextDialogue();
        }
    }

    handleSwipeDown() {
        // Could show quick menu or settings
    }

    handleSwipeUp() {
        // Could hide menu or show save options
    }

    // Handle orientation changes
    handleOrientationChange() {
        // Force a repaint to handle orientation-specific styles
        document.body.style.display = 'none';
        document.body.offsetHeight; // Trigger reflow
        document.body.style.display = '';
        
        // Adjust dialogue box position if needed
        this.adjustLayoutForOrientation();
    }

    // Handle window resize
    handleResize() {
        this.adjustLayoutForOrientation();
    }

    // Adjust layout based on screen size and orientation
    adjustLayoutForOrientation() {
        if (!this.isMobile) return;
        
        const isLandscape = window.innerWidth > window.innerHeight;
        const isSmallScreen = window.innerHeight < 600;
        
        // Adjust character portraits for landscape on small screens
        if (isLandscape && isSmallScreen) {
            document.body.classList.add('landscape-small');
        } else {
            document.body.classList.remove('landscape-small');
        }
        
        // Ensure dialogue box is visible
        if (this.dialogueBox && !this.dialogueBox.classList.contains('hidden')) {
            this.ensureDialogueBoxVisible();
        }
    }

    // Ensure dialogue box is properly positioned and visible
    ensureDialogueBoxVisible() {
        if (!this.dialogueBox) return;
        
        const rect = this.dialogueBox.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // If dialogue box is cut off, adjust its position
        if (rect.bottom > viewportHeight) {
            this.dialogueBox.style.bottom = '10px';
        }
    }

    // Helper method to check if dialogue can advance
    canAdvanceDialogue() {
        return !this.isProcessing && 
               !this.isWaitingForChoice && 
               !this.currentTypewriterInterval &&
               this.choiceContainer?.classList.contains('hidden') !== false &&
               this.dialogueBox?.style.display !== 'none';
    }

    loadStory() {
        this.story = [
            // Scene 1: Garden Meeting - Enhanced
            {
                background: 'garden',
                music: 'peaceful',
                dialogues: [
                    { character: 'narrator', text: "In a beautiful flower garden, cherry blossoms dance in the gentle breeze..." },
                    { character: 'narrator', text: "You walk along a peaceful path, surrounded by vibrant blooms and soft hum of bees." },
                    { character: this.gameState.playerName, text: "What a beautiful day... The flowers here are breathtaking.", portrait: 'player' },
                    { character: 'narrator', text: "Suddenly, you hear footsteps behind you. A young man with kind eyes and messy hair approaches." },
                    { character: 'narrator', text: "He stops a few feet away, pretending to tend to some roses, but you catch him stealing glances at you." },
                    { character: this.gameState.guyName, text: "Excuse me! I couldn't help but notice you admiring the flowers.", portrait: 'guy' },
                    { character: 'narrator', text: "His cheeks turn slightly pink as he realizes he's been caught staring." },
                    { character: this.gameState.guyName, text: "I'm Mahmood. I take care of this garden. Are you new here?", portrait: 'guy' },
                    { character: 'narrator', text: "A gentle breeze ruffles your hair, and a petal lands softly on your shoulder." },
                    { character: 'narrator', text: "Mahmood's eyes follow the petal's path, lingering on your face for just a moment too long." },
                    { character: this.gameState.guyName, text: "Oh! A cherry blossom for you… consider it a gift from the garden.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Haha, thank you! It's beautiful… just like this place.", portrait: 'player' },
                    { character: 'narrator', text: "He smiles warmly, his eyes crinkling at the corners. You notice how his hair catches the sunlight." },
                    { character: this.gameState.guyName, text: "You have such a lovely smile... I mean, the garden looks lovely when you smile at it!", portrait: 'guy' },
                    { character: 'narrator', text: "He fumbles with his words, clearly flustered by his own boldness." },
                    { character: '', text: "How do you respond?", choices: [
                        { text: "Yes, I'm just visiting. This place is magical!", effect: { relationship: 1 } },
                        { text: "I'm looking for a quiet place to think.", effect: { relationship: 0 } },
                        { text: "Actually, I was about to leave...", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 2: Music & Common Interests - Enhanced
            {
                background: 'garden',
                music: 'gentle',
                dialogues: [
                    { character: this.gameState.guyName, text: "I'm glad you like it here. Every flower has its own story... just like people.", portrait: 'guy' },
                    { character: 'narrator', text: "As he speaks, you notice how passionate he becomes, his eyes lighting up with genuine care." },
                    { character: this.gameState.playerName, text: "That's beautiful. You must really love what you do.", portrait: 'player' },
                    { character: 'narrator', text: "While you're looking at the flowers, Mahmood steals another glance at you, a soft smile playing on his lips." },
                    { character: this.gameState.guyName, text: "I do! And when I work, I usually listen to music... it helps me feel alive.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Really? What kind of music do you like?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Mostly soft indie and old classics. Songs that make you feel something real.", portrait: 'guy' },
                    { character: 'narrator', text: "He hums a soft tune as he tends to the flowers. Somehow, the melody matches your heartbeat." },
                    { character: 'narrator', text: "You turn to watch him work, and he catches you looking. Both of you quickly look away, blushing." },
                    { character: this.gameState.playerName, text: "I love that song! Can you teach me how to play it?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Only if you promise to laugh at my terrible singing.", portrait: 'guy' },
                    { character: 'narrator', text: "He starts humming again, this time more confidently, stealing glances to see your reaction." },
                    { character: this.gameState.playerName, text: "Your voice is actually really nice... soothing, like the garden itself.", portrait: 'player' },
                    { character: 'narrator', text: "His face lights up with the most genuine smile you've ever seen." },
                    { character: '', text: "How do you react?", choices: [
                        { text: "Blush and admit you love that kind of music too.", effect: { relationship: 2 } },
                        { text: "Smile and say it suits him.", effect: { relationship: 1 } },
                        { text: "Laugh and say you prefer upbeat pop.", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 3: Café - Enhanced
            {
                background: 'cafe',
                music: 'cozy',
                dialogues: [
                    { character: 'narrator', text: "Later, you and Mahmood find a cozy café with a perfect view of the garden." },
                    { character: this.gameState.guyName, text: "I love this place. The owner lets me bring flowers for the tables.", portrait: 'guy' },
                    { character: 'narrator', text: "As you sit across from each other, you notice how he keeps fidgeting with his napkin, nervous but happy." },
                    { character: this.gameState.guyName, text: "Your smile... it's even brighter than the blossoms. Sorry, was that too much?", portrait: 'guy' },
                    { character: 'narrator', text: "He immediately covers his face with his hands, peeking through his fingers to gauge your reaction." },
                    { character: this.gameState.playerName, text: "Haha... No, it's sweet. But really, your hair looks amazing!", portrait: 'player' },
                    { character: 'narrator', text: "He unconsciously runs his hand through his hair, making it even more endearingly messy." },
                    { character: this.gameState.guyName, text: "Maybe it's magic... or maybe it shines more because you're looking at me.", portrait: 'guy' },
                    { character: 'narrator', text: "You accidentally bump elbows while reaching for the same cookie. Both of you blush." },
                    { character: 'narrator', text: "For a moment, neither of you moves away. The warmth of his arm against yours sends butterflies through your stomach." },
                    { character: this.gameState.guyName, text: "Sorry! I... I didn't mean to... well, maybe I did mean to...", portrait: 'guy' },
                    { character: 'narrator', text: "He's looking directly into your eyes now, completely forgetting about the cookie." },
                    { character: this.gameState.playerName, text: "It's okay... I don't mind.", portrait: 'player' },
                    { character: 'narrator', text: "The afternoon sun streams through the window, creating a golden halo around both of you." },
                    { character: '', text: "The air feels warm between you two. How do you reply?", choices: [
                        { text: "Blush and change the subject.", effect: { relationship: 1 } },
                        { text: "Playfully tease him back.", effect: { relationship: 2 } },
                        { text: "Stay quiet and awkward.", effect: { relationship: 0 } }
                    ] }
                ]
            },

            // Scene 4: Rocky Moment - Enhanced
            {
                background: 'park',
                music: 'tense',
                dialogues: [
                    { character: 'narrator', text: "As the sun sets, a moment of silence lingers between you." },
                    { character: 'narrator', text: "You're sitting on a park bench, watching the sky turn orange and pink." },
                    { character: this.gameState.guyName, text: "Sometimes I wonder... am I just boring you? Maybe you only came here for the flowers.", portrait: 'guy' },
                    { character: 'narrator', text: "His voice is quieter than usual, and he's staring at his hands instead of looking at you." },
                    { character: this.gameState.playerName, text: "What? Why would you think that?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "I don't know... you're so full of life. And me? I just water plants.", portrait: 'guy' },
                    { character: 'narrator', text: "He sighs, looking away, but you notice him nervously fiddling with a flower in his hand." },
                    { character: 'narrator', text: "The flower is a small daisy - he must have picked it for you but lost the courage to give it." },
                    { character: this.gameState.playerName, text: "Hey… it's okay. I like spending time with you, really.", portrait: 'player' },
                    { character: 'narrator', text: "You gently touch his hand, and he finally looks up at you with vulnerable, hopeful eyes." },
                    { character: this.gameState.guyName, text: "I... I picked this for you earlier. But I thought you might think it's silly.", portrait: 'guy' },
                    { character: 'narrator', text: "He holds out the slightly crumpled daisy, his cheeks red with embarrassment." },
                    { character: this.gameState.playerName, text: "It's perfect. Just like this moment.", portrait: 'player' },
                    { character: 'narrator', text: "His face transforms with relief and joy, like the sun breaking through clouds." },
                    { character: '', text: "How do you respond?", choices: [
                        { text: "Reassure him: 'I came here because you make this place special.'", effect: { relationship: 2 } },
                        { text: "Laugh softly: 'You're silly, Mahmood.'", effect: { relationship: 0 } },
                        { text: "Say nothing and look away.", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 5: Romantic Night Walk - Enhanced
            {
                background: 'evening',
                music: 'romantic',
                dialogues: [
                    { character: 'narrator', text: "The stars twinkle above as you and Mahmood walk slowly under the night sky." },
                    { character: 'narrator', text: "The garden looks magical in the moonlight, with soft shadows dancing between the flowers." },
                    { character: this.gameState.guyName, text: "Your eyes... they shine brighter than these stars. And your laughter... I could listen to it forever.", portrait: 'guy' },
                    { character: 'narrator', text: "He stops walking and turns to face you completely, his expression soft and sincere." },
                    { character: this.gameState.playerName, text: "And you... your hair, your music, your soul. You're unforgettable.", portrait: 'player' },
                    { character: 'narrator', text: "He gently tucks a flower behind your ear. Your fingers accidentally touch his hand. Both of you freeze and laugh nervously." },
                    { character: 'narrator', text: "But this time, neither of you pulls away. His hand lingers near your cheek." },
                    { character: this.gameState.guyName, text: "Your laugh… it's even more beautiful than I imagined.", portrait: 'guy' },
                    { character: 'narrator', text: "He's looking at you like you're the most precious thing in his garden." },
                    { character: this.gameState.playerName, text: "Stop… you're making me blush!", portrait: 'player' },
                    { character: 'narrator', text: "The moonlight catches the sparkle in both your eyes as you stand close together." },
                    { character: this.gameState.guyName, text: "I... I've never felt this way before. Being with you feels like coming home.", portrait: 'guy' },
                    { character: 'narrator', text: "A shooting star streaks across the sky above you, as if the universe is blessing this moment." },
                    { character: this.gameState.playerName, text: "Make a wish...", portrait: 'player' },
                    { character: this.gameState.guyName, text: "I already have everything I could wish for right here.", portrait: 'guy' },
                    { character: '', text: "What happens next?", choices: [
                        { text: "Take his hand and smile softly.", effect: { relationship: 2, gesture: 'handHold' } },
                        { text: "Step closer and hug him.", effect: { relationship: 2, gesture: 'hug' } },
                        { text: "Stay shy but smile at him warmly.", effect: { relationship: 1, gesture: 'smile' } }
                    ] }
                ]
            }
        ];
    }

    startGame() {
        this.titleScreen?.classList.add('hidden');
        this.currentScene = 0;
        this.currentDialogue = 0;
        this.isWaitingForChoice = false;
        this.showScene();
    }

    continueGame() {
        try {
            const savedGame = localStorage.getItem('flowerNovelSave');
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                this.currentScene = gameData.scene || 0;
                this.currentDialogue = gameData.dialogue || 0;
                this.gameState = { ...this.gameState, ...gameData.state };
                this.titleScreen?.classList.add('hidden');
                this.isWaitingForChoice = false;
                this.showScene();
            } else {
                this.startGame();
            }
        } catch (error) {
            console.error('Error loading game:', error);
            this.startGame();
        }
    }

    showScene() {
        if (this.currentScene >= this.story.length) {
            this.showEnding();
            return;
        }
        
        const scene = this.story[this.currentScene];
        if (!scene) {
            this.showEnding();
            return;
        }
        
        this.setBackground(scene.background);
        
        // Play scene music if available
        if (scene.music) {
            this.playMusic(scene.music);
        }
        
        this.currentDialogue = 0;
        this.isWaitingForChoice = false;
        this.showDialogue();
    }

    showDialogue() {
        if (this.currentScene >= this.story.length) {
            this.showEnding();
            return;
        }
        
        const scene = this.story[this.currentScene];
        if (!scene?.dialogues) {
            this.nextScene();
            return;
        }
        
        if (this.currentDialogue >= scene.dialogues.length) {
            this.nextScene();
            return;
        }
        
        const dialogue = scene.dialogues[this.currentDialogue];
        if (!dialogue) {
            this.nextScene();
            return;
        }

        // Hide choices and show dialogue box
        this.choiceContainer?.classList.add('hidden');
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'block';
        }
        
        this.showCharacter(dialogue.portrait, dialogue.emotion);

        // Handle character name display
        if (this.characterName) {
            if (dialogue.character === 'narrator') {
                this.characterName.textContent = '';
                this.characterName.style.display = 'none';
            } else {
                this.characterName.textContent = dialogue.character;
                this.characterName.style.display = 'block';
            }
        }

        // Clear any existing typewriter effect
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
        }

        // Trigger romantic effects based on dialogue content
        this.triggerRomanticEffects(dialogue);

        this.typewriterEffect(dialogue.text);

        // Handle choices vs continue
        if (dialogue.choices) {
            this.isWaitingForChoice = true;
            if (this.continueIndicator) {
                this.continueIndicator.style.display = 'none';
            }
            // Wait for typewriter to finish before showing choices
            setTimeout(() => {
                if (this.dialogueBox) {
                    this.dialogueBox.style.display = 'none';
                }
                this.showChoices(dialogue.choices);
            }, dialogue.text.length * 30 + 500); // Wait for typewriter + buffer
        } else {
            this.isWaitingForChoice = false;
            if (this.continueIndicator) {
                this.continueIndicator.style.display = 'block';
            }
        }
    }

    typewriterEffect(text) {
        if (!this.dialogueText) {
            console.error('dialogueText element not found');
            return;
        }
        
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
        }
        
        this.dialogueText.textContent = '';
        let i = 0;
        const speed = 30;
        
        this.currentTypewriterInterval = setInterval(() => {
            if (i < text.length) {
                this.dialogueText.textContent += text.charAt(i++);
            } else {
                clearInterval(this.currentTypewriterInterval);
                this.currentTypewriterInterval = null;
            }
        }, speed);
    }

    showChoices(choices) {
        const choiceButtons = document.querySelectorAll('.choice-btn');
        if (!choiceButtons.length) {
            console.error('Choice buttons not found');
            return;
        }
        
        // Setup choice buttons with enhanced touch support
        choices.forEach((choice, index) => {
            if (choiceButtons[index]) {
                choiceButtons[index].textContent = choice.text;
                choiceButtons[index].style.display = 'block';
                
                // Remove any existing event listeners
                choiceButtons[index].onclick = null;
                choiceButtons[index].ontouchstart = null;
                choiceButtons[index].ontouchend = null;
                choiceButtons[index].ontouchcancel = null;
                
                // Add new touch-friendly event listeners
                this.addTouchAndClickListener(choiceButtons[index], () => this.selectChoice(choice));
            }
        });
        
        // Hide unused buttons
        for (let i = choices.length; i < choiceButtons.length; i++) {
            if (choiceButtons[i]) {
                choiceButtons[i].style.display = 'none';
            }
        }
        
        // Show choice container
        this.choiceContainer?.classList.remove('hidden');
        
        // Ensure choices are visible on mobile
        if (this.isMobile) {
            setTimeout(() => {
                this.ensureChoicesVisible();
            }, 100);
        }
    }

    // Ensure choice buttons are visible on mobile
    ensureChoicesVisible() {
        if (!this.choiceContainer) return;
        
        const rect = this.choiceContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // If choice container is cut off, adjust its position
        if (rect.bottom > viewportHeight) {
            this.choiceContainer.style.bottom = '10px';
        }
    }

    selectChoice(choice) {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.isWaitingForChoice = false;
        
        // Hide choices immediately
        this.choiceContainer?.classList.add('hidden');
        
        // Show dialogue box again
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'block';
        }
        
        // Apply choice effects
        if (choice.effect) {
            if (choice.effect.relationship) {
                this.gameState.relationship += choice.effect.relationship;
            }
            if (choice.effect.scene) {
                this.gameState.flags.nextScene = choice.effect.scene;
            }
            if (choice.effect.gesture) {
                this.gameState.flags.gesture = choice.effect.gesture;
            }
        }
        
        // Move to next dialogue/scene
        this.currentDialogue++;
        
        // Small delay to prevent immediate re-triggering
        setTimeout(() => {
            this.isProcessing = false;
            this.showDialogue();
        }, 200);
    }

    nextDialogue() {
        if (this.isProcessing || this.isWaitingForChoice) return;
        
        this.isProcessing = true;
        
        // Skip typewriter if it's running
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
            const scene = this.story[this.currentScene];
            const dialogue = scene?.dialogues[this.currentDialogue];
            if (dialogue && this.dialogueText) {
                this.dialogueText.textContent = dialogue.text;
            }
            this.isProcessing = false;
            return;
        }
        
        this.currentDialogue++;
        
        setTimeout(() => {
            this.isProcessing = false;
            this.showDialogue();
        }, 100);
    }

    nextScene() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.currentScene++;
        this.currentDialogue = 0;
        this.isWaitingForChoice = false;
        
        setTimeout(() => {
            this.isProcessing = false;
            if (this.currentScene < this.story.length) {
                this.showScene();
            } else {
                this.showEnding();
            }
        }, 200);
    }

    showCharacter(portrait, emotion = 'normal') {
        this.characterLeft?.classList.remove('active', 'staring', 'shy', 'blushing');
        this.characterRight?.classList.remove('active', 'staring', 'shy', 'blushing');
        
        if (portrait === 'player') {
            if (this.characterLeft) {
                this.characterLeft.style.backgroundImage = 'url("character.png")';
                this.characterLeft.classList.add('active');
                if (emotion) this.characterLeft.classList.add(emotion);
            }
        } else if (portrait === 'guy') {
            if (this.characterRight) {
                this.characterRight.style.backgroundImage = 'url("guy.png")';
                this.characterRight.classList.add('active');
                if (emotion) this.characterRight.classList.add(emotion);
            }
        }
    }

    // Add subtle romantic moments and staring mechanics
    addStaringMoment(starerPortrait, duration = 3000) {
        const starer = starerPortrait === 'guy' ? this.characterRight : this.characterLeft;
        const target = starerPortrait === 'guy' ? this.characterLeft : this.characterRight;
        
        if (starer && target) {
            // Add staring class for visual effect
            starer.classList.add('staring');
            
            // Add a subtle heart effect
            this.createHeartEffect(starer);
            
            // Remove staring effect after duration
            setTimeout(() => {
                starer.classList.remove('staring');
            }, duration);
        }
    }

    createHeartEffect(element) {
        const heart = document.createElement('div');
        heart.innerHTML = '💕';
        heart.style.position = 'absolute';
        heart.style.fontSize = '20px';
        heart.style.opacity = '0.8';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '1000';
        heart.style.animation = 'heartFloat 2s ease-out forwards';
        
        // Position near the character
        const rect = element.getBoundingClientRect();
        heart.style.left = (rect.left + rect.width / 2) + 'px';
        heart.style.top = (rect.top + 20) + 'px';
        
        document.body.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 2000);
    }

    triggerShyMoment(character) {
        const characterElement = character === 'player' ? this.characterLeft : this.characterRight;
        if (characterElement) {
            characterElement.classList.add('shy');
            setTimeout(() => {
                characterElement.classList.remove('shy');
            }, 2000);
        }
    }

    triggerBlushMoment(character) {
        const characterElement = character === 'player' ? this.characterLeft : this.characterRight;
        if (characterElement) {
            characterElement.classList.add('blushing');
            setTimeout(() => {
                characterElement.classList.remove('blushing');
            }, 3000);
        }
    }

    triggerRomanticEffects(dialogue) {
        const text = dialogue.text.toLowerCase();
        
        // Trigger staring moments based on dialogue content
        if (text.includes('staring') || text.includes('glance') || text.includes('looking at') || 
            text.includes('catches you looking') || text.includes('steals another glance') ||
            text.includes('eyes follow') || text.includes('lingering on your face')) {
            
            if (dialogue.character === this.gameState.guyName || text.includes('mahmood')) {
                setTimeout(() => this.addStaringMoment('guy'), 1000);
            } else if (dialogue.character === this.gameState.playerName || text.includes('you turn to watch')) {
                setTimeout(() => this.addStaringMoment('player'), 1000);
            }
        }
        
        // Trigger blushing moments
        if (text.includes('blush') || text.includes('cheeks turn') || text.includes('face lights up') ||
            text.includes('flustered') || text.includes('fumbles with his words')) {
            
            if (dialogue.character === this.gameState.guyName || text.includes('mahmood') || text.includes('his cheeks')) {
                setTimeout(() => this.triggerBlushMoment('guy'), 500);
            } else if (dialogue.character === this.gameState.playerName || text.includes('both of you')) {
                setTimeout(() => this.triggerBlushMoment('player'), 500);
                setTimeout(() => this.triggerBlushMoment('guy'), 700);
            }
        }
        
        // Trigger shy moments
        if (text.includes('shy') || text.includes('nervous') || text.includes('quickly look away') ||
            text.includes('fumbles') || text.includes('hesitant')) {
            
            if (dialogue.character === this.gameState.guyName || text.includes('mahmood')) {
                setTimeout(() => this.triggerShyMoment('guy'), 800);
            } else if (dialogue.character === this.gameState.playerName) {
                setTimeout(() => this.triggerShyMoment('player'), 800);
            }
        }
        
        // Special romantic moments with heart effects
        if (text.includes('smile') || text.includes('laugh') || text.includes('beautiful') ||
            text.includes('lovely') || text.includes('magical') || text.includes('perfect')) {
            
            const heartTarget = dialogue.character === this.gameState.guyName ? this.characterRight : this.characterLeft;
            if (heartTarget) {
                setTimeout(() => this.createHeartEffect(heartTarget), 1500);
            }
        }
    }

    // Background preloading methods
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
        if (this.titleScreen) {
            this.titleScreen.style.display = 'none';
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
        if (this.titleScreen) {
            this.titleScreen.style.display = 'flex';
        }
    }

    updateLoadingProgress(progress, text) {
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${progress}%`;
        }
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    async preloadBackgrounds() {
        const backgroundNames = Object.keys(this.backgroundUrls);
        const totalBackgrounds = backgroundNames.length;
        let loadedCount = 0;

        console.log('Starting background preload...');
        this.updateLoadingProgress(0, 'Loading backgrounds...');
        
        const loadPromises = backgroundNames.map(async (name) => {
            try {
                const url = this.backgroundUrls[name];
                const img = new Image();
                
                return new Promise((resolve, reject) => {
                    img.onload = () => {
                        this.backgroundCache.set(name, url);
                        loadedCount++;
                        const progress = (loadedCount / totalBackgrounds) * 100;
                        this.updateLoadingProgress(progress, `Loading ${name}... (${loadedCount}/${totalBackgrounds})`);
                        console.log(`Loaded background: ${name} (${Math.round(progress)}%)`);
                        resolve(name);
                    };
                    
                    img.onerror = () => {
                        console.warn(`Failed to load background: ${name}`);
                        // Still cache the URL even if loading fails
                        this.backgroundCache.set(name, url);
                        loadedCount++;
                        const progress = (loadedCount / totalBackgrounds) * 100;
                        this.updateLoadingProgress(progress, `Loading ${name}... (${loadedCount}/${totalBackgrounds})`);
                        resolve(name);
                    };
                    
                    img.src = url;
                });
            } catch (error) {
                console.error(`Error preloading background ${name}:`, error);
                return name;
            }
        });

        try {
            await Promise.all(loadPromises);
            this.backgroundsLoaded = true;
            this.updateLoadingProgress(100, 'Loading complete!');
            console.log('All backgrounds preloaded successfully!');
            
            // Wait a moment to show completion, then hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
        } catch (error) {
            console.error('Error during background preloading:', error);
            this.backgroundsLoaded = true; // Continue anyway
            this.hideLoadingScreen();
        }
    }

    setBackground(backgroundType) {
        if (!this.background) return;
        
        // Use cached background if available, otherwise fallback to direct URL
        const backgroundUrl = this.backgroundCache.get(backgroundType) || this.backgroundUrls[backgroundType] || this.backgroundUrls.garden;
        
        this.background.style.backgroundImage = `url(${backgroundUrl})`;
        this.background.style.backgroundSize = 'cover';
        this.background.style.backgroundPosition = 'center';
        this.background.style.backgroundRepeat = 'no-repeat';
        
        // Add smooth transition effect
        this.background.style.transition = 'background-image 0.5s ease-in-out';
        
        // Log background change for debugging
        console.log(`Background changed to: ${backgroundType}`);
    }

    // Get preloading progress (useful for loading screens)
    getLoadingProgress() {
        return {
            progress: this.loadingProgress,
            isComplete: this.backgroundsLoaded,
            loadedBackgrounds: Array.from(this.backgroundCache.keys())
        };
    }

    // Check if a specific background is loaded
    isBackgroundLoaded(backgroundType) {
        return this.backgroundCache.has(backgroundType);
    }

    showEnding() {
        // Determine ending based on relationship level
        const relationshipLevel = this.gameState.relationship;
        let endingType = 'low'; // Default to low ending
        
        if (relationshipLevel >= 6) {
            endingType = 'high'; // Happy ending
        } else if (relationshipLevel >= 2) {
            endingType = 'medium'; // Continue seeing each other
        }
        
        console.log(`Relationship level: ${relationshipLevel}, Ending type: ${endingType}`);
        
        // Set appropriate background and music
        if (endingType === 'high') {
            this.setBackground('evening');
            this.playMusic('romantic');
        } else if (endingType === 'medium') {
            this.setBackground('garden');
            this.playMusic('gentle');
        } else {
            this.setBackground('garden');
            this.playMusic('peaceful');
        }
        
        if (this.characterName) {
            this.characterName.textContent = 'The End';
            this.characterName.style.display = 'block';
        }
        
        if (this.continueIndicator) {
            this.continueIndicator.style.display = 'none';
        }

        // Show ending based on relationship level
        this.showEndingSequence(endingType);
    }

    showEndingSequence(endingType) {
        // Clear any existing event handlers to prevent conflicts
        if (this.dialogueBox) {
            this.dialogueBox.onclick = null;
        }
        document.onkeydown = null;
        
        const endings = {
            low: [
                { character: 'narrator', text: "As the days pass, you and Mahmood part ways, but something lingers in the air..." },
                { character: 'narrator', text: "A week later, you receive a gentle message from him." },
                { character: this.gameState.guyName, text: "I know we didn't connect the way I hoped, but I want you to know...", portrait: 'guy' },
                { character: this.gameState.guyName, text: "I'll be in the garden every day, tending to the flowers and thinking of you.", portrait: 'guy' },
                { character: this.gameState.guyName, text: "If you ever want to talk, or just enjoy the peaceful silence together...", portrait: 'guy' },
                { character: this.gameState.guyName, text: "I'll be there, waiting. No pressure, no expectations. Just... hope.", portrait: 'guy' },
                { character: 'narrator', text: "You look out your window toward the garden, touched by his gentle persistence." },
                { character: 'narrator', text: "Perhaps someday, when you're ready, you'll find your way back to those cherry blossoms..." },
                { character: 'narrator', text: "And maybe, just maybe, love will bloom in its own time. 🌸" }
            ],
            medium: [
                { character: 'narrator', text: "Over the following weeks, you and Mahmood continue to meet in the garden." },
                { character: 'narrator', text: "Your friendship grows slowly, like the flowers he tends so carefully." },
                { character: this.gameState.guyName, text: "I'm glad we can spend time together like this. No rush, no pressure.", portrait: 'guy' },
                { character: this.gameState.playerName, text: "Me too. There's something special about these quiet moments.", portrait: 'player' },
                { character: 'narrator', text: "You walk together through the garden paths, sharing stories and comfortable silences." },
                { character: this.gameState.guyName, text: "You know, I used to think love had to be dramatic, like in movies.", portrait: 'guy' },
                { character: this.gameState.guyName, text: "But this... this feels real. Like we're writing our own story, one day at a time.", portrait: 'guy' },
                { character: this.gameState.playerName, text: "I like our story. It's gentle, like your garden.", portrait: 'player' },
                { character: 'narrator', text: "As the sun sets, you both know this is just the beginning." },
                { character: 'narrator', text: "Your love story will continue to grow, season by season, bloom by bloom. 🌺" }
            ],
            high: [
                { character: 'narrator', text: "Under the starlit sky, you and Mahmood stand close together in the garden." },
                { character: 'narrator', text: "The air is filled with the sweet scent of night-blooming jasmine." },
                { character: this.gameState.guyName, text: "I never believed in fairy tales until I met you.", portrait: 'guy' },
                { character: this.gameState.playerName, text: "And I never knew a garden could hold so much magic.", portrait: 'player' },
                { character: 'narrator', text: "He takes your hands gently, his eyes reflecting the moonlight." },
                { character: this.gameState.guyName, text: "Would you... would you like to help me tend this garden? Together?", portrait: 'guy' },
                { character: this.gameState.playerName, text: "I'd love nothing more. We'll make it the most beautiful garden in the world.", portrait: 'player' },
                { character: 'narrator', text: "As you embrace under the stars, cherry blossoms fall around you like confetti." },
                { character: 'narrator', text: "Your love has bloomed into something beautiful and eternal." },
                { character: 'narrator', text: "And in this garden of dreams, your happily ever after begins. ✨💕🌸" }
            ]
        };

        const endingDialogues = endings[endingType];
        let currentDialogue = 0;

        const showNextDialogue = () => {
            if (currentDialogue < endingDialogues.length) {
                const dialogue = endingDialogues[currentDialogue];
                
                // Show character portrait if specified
                this.showCharacter(dialogue.portrait);
                
                // Handle character name display
                if (this.characterName) {
                    if (dialogue.character === 'narrator') {
                        this.characterName.textContent = '';
                        this.characterName.style.display = 'none';
                    } else {
                        this.characterName.textContent = dialogue.character;
                        this.characterName.style.display = 'block';
                    }
                }

                this.typewriterEffect(dialogue.text);
                currentDialogue++;

                // Wait for user input to continue
                const waitForContinue = () => {
                    if (this.canAdvanceDialogue()) {
                        const continueHandler = () => {
                            // Clear handlers before proceeding
                            if (this.dialogueBox) {
                                this.dialogueBox.onclick = null;
                            }
                            document.onkeydown = null;
                            showNextDialogue();
                        };

                        if (this.dialogueBox) {
                            this.dialogueBox.onclick = continueHandler;
                        }
                        document.onkeydown = (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                continueHandler();
                            }
                        };
                    } else {
                        setTimeout(waitForContinue, 200);
                    }
                };
                waitForContinue();
            } else {
                // Clear all handlers before showing letter
                if (this.dialogueBox) {
                    this.dialogueBox.onclick = null;
                }
                document.onkeydown = null;
                
                // Show the ending letter before restart option
                setTimeout(() => {
                    this.showEndingLetter(endingType);
                }, 1000);
            }
        };

        showNextDialogue();
    }

    showRestartOption() {
        this.typewriterEffect("✨ Thank you for playing! Would you like to start a new story?");

        const choiceButtons = document.querySelectorAll('.choice-btn');
        if (choiceButtons[0]) {
            choiceButtons[0].textContent = 'Start New Story';
            choiceButtons[0].style.display = 'block';
            choiceButtons[0].onclick = () => location.reload();
        }

        for (let i = 1; i < choiceButtons.length; i++) {
            if (choiceButtons[i]) {
                choiceButtons[i].style.display = 'none';
            }
        }

        this.choiceContainer?.classList.remove('hidden');
    }


    typewriterInLetter(elementId, text, callback) {
        const el = document.getElementById(elementId);
        if (!el) {
            console.error(`Element with id '${elementId}' not found`);
            if (callback) callback();
            return;
        }
        
        el.textContent = '';
        let i = 0;
        const speed = 25;
        
        const interval = setInterval(() => {
            if (i < text.length) {
                el.textContent += text.charAt(i++);
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, speed);
    }

    showEndingLetter(endingType) {
        const letterContent = {
            low: {
                title: "A Letter from Mahmood",
                text: `My dearest ${this.gameState.playerName},

I hope this letter finds you well. I've been sitting in our garden every evening, watching the cherry blossoms dance in the breeze, and I can't help but think of you.

I know our time together was brief, and perhaps I wasn't able to express my feelings as clearly as I hoped. But I want you to know that meeting you changed something in me. Your smile, your laughter, the way you looked at the flowers with such wonder – it all made the garden feel more alive than it ever had before.

I don't expect anything from you, and I don't want to burden you with my feelings. I just wanted you to know that you brought light into my world, even if it was just for a moment.

The flowers here will always remind me of you. And if someday you find yourself walking past this garden again, know that you'll always be welcome here.

Take care of yourself, and may your days be filled with as much beauty as you brought to mine.`
            },
            medium: {
                title: "A Letter from Your Garden Friend",
                text: `Dear ${this.gameState.playerName},

As I write this, I'm surrounded by the flowers we've come to love together. The roses are blooming more beautifully than ever, and I like to think it's because they've felt the warmth of our friendship.

These past weeks have been wonderful. Our conversations, our shared silences, the way we've learned to appreciate the small moments together – it all means more to me than you might realize.

I find myself looking forward to our meetings with a joy I haven't felt in years. There's something special about the way you see the world, the way you make even the simplest moments feel meaningful.

I wanted to put these feelings into words because sometimes the heart speaks more clearly through a letter than through spoken words. You've become such an important part of my life, and I hope I've become a meaningful part of yours too.

Whatever the future holds, I'm grateful for this time we've shared. The garden is more beautiful because you're in it, and my life is richer because you're in it too.

Looking forward to many more sunsets together among the flowers.`
            },
            high: {
                title: "A Love Letter to My Heart",
                text: `My beloved ${this.gameState.playerName},

How do I begin to express what you mean to me? Every morning when I wake up, my first thought is of you. Every evening when the stars appear, I wish you were here to share their beauty with me.

You've transformed not just this garden, but my entire world. Before you, I was content to tend to flowers in solitude. Now, I can't imagine a single day without your laughter, your touch, your presence beside me.

The way you look at me makes me feel like I could move mountains. The way you smile makes every flower in this garden pale in comparison. The way you love makes me believe in magic, in fairy tales, in happily ever after.

I want to spend every sunrise and sunset with you. I want to plant new flowers together and watch them grow, just like our love has grown. I want to build a life with you that's as beautiful and enduring as this garden we both cherish.

You are my heart, my home, my everything. And if you'll have me, I want to be yours for all the seasons to come.

This garden brought us together, but it's your love that makes it – and me – complete.

Forever and always yours,`
            }
        };

        const letter = letterContent[endingType];
        if (!letter) return;

        // Get letter elements
        const letterDisplay = document.getElementById('letter-display');
        const letterTitle = document.getElementById('letter-title');
        const letterText = document.getElementById('letter-text');
        const closeButton = document.getElementById('close-letter');

        if (!letterDisplay || !letterTitle || !letterText) return;

        // Set letter content
        letterTitle.textContent = letter.title;
        letterText.textContent = '';

        // Show letter display
        letterDisplay.classList.remove('hidden');
        letterDisplay.classList.add('visible');

        // Hide dialogue box and characters
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'none';
        }
        this.showCharacter(null); // Hide characters

        // Start typewriter effect for letter content
        this.typewriterInLetter('letter-text', letter.text, () => {
            // After letter is fully typed, set up close functionality
            const closeHandler = () => {
                letterDisplay.classList.remove('visible');
                letterDisplay.classList.add('hidden');
                
                // Show restart option after closing letter
                setTimeout(() => {
                    this.showRestartOption();
                }, 500);
            };

            // Set up close button
            if (closeButton) {
                closeButton.onclick = closeHandler;
            }

            // Allow clicking anywhere on letter to close
            letterDisplay.onclick = (e) => {
                if (e.target === letterDisplay) {
                    closeHandler();
                }
            };

            // Allow ESC key to close
            document.onkeydown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeHandler();
                }
            };
        });
    }

    saveGame() {
        try {
            const saveData = {
                scene: this.currentScene,
                dialogue: this.currentDialogue,
                state: this.gameState
            };
            localStorage.setItem('flowerNovelSave', JSON.stringify(saveData));
            alert('Game saved! 💾');
        } catch (error) {
            console.error('Error saving game:', error);
            alert('Error saving game!');
        }
    }

    loadGame() {
        try {
            const savedGame = localStorage.getItem('flowerNovelSave');
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                this.currentScene = gameData.scene || 0;
                this.currentDialogue = gameData.dialogue || 0;
                this.gameState = { ...this.gameState, ...gameData.state };
                this.isWaitingForChoice = false;
                this.showScene();
                alert('Game loaded! 📁');
            } else {
                alert('No saved game found!');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            alert('Error loading game!');
        }
    }

    showSettings() {
        const musicStatus = this.isMusicEnabled ? 'ON' : 'OFF';
        const volumePercent = Math.round(this.musicVolume * 100);
        
        const settingsMessage = `🎵 Music Settings 🎵\n\n` +
            `Music: ${musicStatus}\n` +
            `Volume: ${volumePercent}%\n\n` +
            `Commands:\n` +
            `• Press 'M' to toggle music\n` +
            `• Press '+' to increase volume\n` +
            `• Press '-' to decrease volume`;
            
        alert(settingsMessage);
    }

    // Audio Management Methods
    playMusic(musicName) {
        if (!this.isMusicEnabled || !musicName) return;

        // Stop current music if playing
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        // Get the new music element
        const musicElement = document.getElementById(musicName + '-music');
        if (musicElement) {
            this.currentMusic = musicElement;
            this.currentMusic.volume = this.musicVolume;
            
            // Play with fade in effect
            this.currentMusic.volume = 0;
            this.currentMusic.play().catch(e => {
                console.log('Music play failed:', e);
            });
            
            // Fade in
            this.fadeInMusic();
        } else {
            console.warn(`Music element not found: ${musicName}-music`);
        }
    }

    fadeInMusic() {
        if (!this.currentMusic) return;
        
        const fadeInterval = setInterval(() => {
            if (this.currentMusic.volume < this.musicVolume) {
                this.currentMusic.volume = Math.min(this.currentMusic.volume + 0.05, this.musicVolume);
            } else {
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    fadeOutMusic(callback) {
        if (!this.currentMusic) {
            if (callback) callback();
            return;
        }
        
        const fadeInterval = setInterval(() => {
            if (this.currentMusic.volume > 0) {
                this.currentMusic.volume = Math.max(this.currentMusic.volume - 0.05, 0);
            } else {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                clearInterval(fadeInterval);
                if (callback) callback();
            }
        }, 100);
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }

    toggleMusic() {
        this.isMusicEnabled = !this.isMusicEnabled;
        if (!this.isMusicEnabled) {
            this.stopMusic();
        } else {
            // Resume music for current scene if available
            const currentScene = this.story[this.currentScene];
            if (currentScene && currentScene.music) {
                this.playMusic(currentScene.music);
            }
        }
        return this.isMusicEnabled;
    }
}

// Initialize game with singleton pattern
let visualNovelInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!visualNovelInstance) {
        visualNovelInstance = new VisualNovel();
    }
});