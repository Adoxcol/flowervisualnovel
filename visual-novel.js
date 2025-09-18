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
        this.musicVolume = 0.5;
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
            // Scene 1: Garden Meeting
            {
                background: 'garden',
                music: 'peaceful',
                dialogues: [
                    { character: 'narrator', text: "In a beautiful flower garden, cherry blossoms dance in the gentle breeze..." },
                    { character: 'narrator', text: "You walk along a peaceful path, surrounded by vibrant blooms and soft hum of bees." },
                    { character: this.gameState.playerName, text: "What a beautiful day... The flowers here are breathtaking.", portrait: 'player' },
                    { character: 'narrator', text: "Suddenly, you hear footsteps behind you. A young man with kind eyes and messy hair approaches." },
                    { character: this.gameState.guyName, text: "Excuse me! I couldn't help but notice you admiring the flowers.", portrait: 'guy' },
                    { character: this.gameState.guyName, text: "I'm Mahmood. I take care of this garden. Are you new here?", portrait: 'guy' },
                    { character: 'narrator', text: "A gentle breeze ruffles your hair, and a petal lands softly on your shoulder." },
                    { character: this.gameState.guyName, text: "Oh! A cherry blossom for you… consider it a gift from the garden.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Haha, thank you! It's beautiful… just like this place.", portrait: 'player' },
                    { character: '', text: "How do you respond?", choices: [
                        { text: "Yes, I'm just visiting. This place is magical!", effect: { relationship: 1 } },
                        { text: "I'm looking for a quiet place to think.", effect: { relationship: 0 } },
                        { text: "Actually, I was about to leave...", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 2: Music & Common Interests
            {
                background: 'garden',
                music: 'gentle',
                dialogues: [
                    { character: this.gameState.guyName, text: "I'm glad you like it here. Every flower has its own story... just like people.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "That's beautiful. You must really love what you do.", portrait: 'player' },
                    { character: this.gameState.guyName, text: "I do! And when I work, I usually listen to music... it helps me feel alive.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Really? What kind of music do you like?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Mostly soft indie and old classics. Songs that make you feel something real.", portrait: 'guy' },
                    { character: 'narrator', text: "He hums a soft tune as he tends to the flowers. Somehow, the melody matches your heartbeat." },
                    { character: this.gameState.playerName, text: "I love that song! Can you teach me how to play it?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Only if you promise to laugh at my terrible singing.", portrait: 'guy' },
                    { character: '', text: "How do you react?", choices: [
                        { text: "Blush and admit you love that kind of music too.", effect: { relationship: 2 } },
                        { text: "Smile and say it suits him.", effect: { relationship: 1 } },
                        { text: "Laugh and say you prefer upbeat pop.", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 3: Café
            {
                background: 'cafe',
                music: 'cozy',
                dialogues: [
                    { character: 'narrator', text: "Later, you and Mahmood find a cozy café with a perfect view of the garden." },
                    { character: this.gameState.guyName, text: "I love this place. The owner lets me bring flowers for the tables.", portrait: 'guy' },
                    { character: this.gameState.guyName, text: "Your smile... it's even brighter than the blossoms. Sorry, was that too much?", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Haha... No, it's sweet. But really, your hair looks amazing!", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Maybe it's magic... or maybe it shines more because you're looking at me.", portrait: 'guy' },
                    { character: 'narrator', text: "You accidentally bump elbows while reaching for the same cookie. Both of you blush." },
                    { character: '', text: "The air feels warm between you two. How do you reply?", choices: [
                        { text: "Blush and change the subject.", effect: { relationship: 1 } },
                        { text: "Playfully tease him back.", effect: { relationship: 2 } },
                        { text: "Stay quiet and awkward.", effect: { relationship: 0 } }
                    ] }
                ]
            },

            // Scene 4: Rocky Moment
            {
                background: 'park',
                music: 'tense',
                dialogues: [
                    { character: 'narrator', text: "As the sun sets, a moment of silence lingers between you." },
                    { character: this.gameState.guyName, text: "Sometimes I wonder... am I just boring you? Maybe you only came here for the flowers.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "What? Why would you think that?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "I don't know... you're so full of life. And me? I just water plants.", portrait: 'guy' },
                    { character: 'narrator', text: "He sighs, looking away, but you notice him nervously fiddling with a flower in his hand." },
                    { character: this.gameState.playerName, text: "Hey… it's okay. I like spending time with you, really.", portrait: 'player' },
                    { character: '', text: "How do you respond?", choices: [
                        { text: "Reassure him: 'I came here because you make this place special.'", effect: { relationship: 2 } },
                        { text: "Laugh softly: 'You're silly, Mahmood.'", effect: { relationship: 0 } },
                        { text: "Say nothing and look away.", effect: { relationship: -1 } }
                    ] }
                ]
            },

            // Scene 5: Romantic Night Walk
            {
                background: 'evening',
                music: 'romantic',
                dialogues: [
                    { character: 'narrator', text: "The stars twinkle above as you and Mahmood walk slowly under the night sky." },
                    { character: this.gameState.guyName, text: "Your eyes... they shine brighter than these stars. And your laughter... I could listen to it forever.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "And you... your hair, your music, your soul. You're unforgettable.", portrait: 'player' },
                    { character: 'narrator', text: "He gently tucks a flower behind your ear. Your fingers accidentally touch his hand. Both of you freeze and laugh nervously." },
                    { character: this.gameState.guyName, text: "Your laugh… it's even more beautiful than I imagined.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "Stop… you're making me blush!", portrait: 'player' },
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

        // Clear any existing typewriter effect
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
        }

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

    showCharacter(portrait) {
        this.characterLeft?.classList.remove('active');
        this.characterRight?.classList.remove('active');
        
        if (portrait === 'player') {
            if (this.characterLeft) {
                this.characterLeft.style.backgroundImage = 'url("character.png")';
                this.characterLeft.classList.add('active');
            }
        } else if (portrait === 'guy') {
            if (this.characterRight) {
                this.characterRight.style.backgroundImage = 'url("guy.png")';
                this.characterRight.classList.add('active');
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
    this.setBackground('evening');
    
    if (this.characterName) {
        this.characterName.textContent = 'The End';
        this.characterName.style.display = 'block';
    }
    
    if (this.continueIndicator) {
        this.continueIndicator.style.display = 'none';
    }

    const endingText = "Your story has concluded. But there are letters for Simin...";
    this.typewriterEffect(endingText);

    // After the typewriter, show letters in the dialogue box
    setTimeout(() => {
        this.checkTypewriterAndShowLetters();
    }, endingText.length * 30 + 500);
}

checkTypewriterAndShowLetters() {
    if (!this.currentTypewriterInterval) {
        this.showLettersSequence();
    } else {
        setTimeout(() => this.checkTypewriterAndShowLetters(), 100);
    }
}

showLettersSequence() {
    const letters = [
        `Dear Simin,

I've missed you so much, my princess. All I can think about is your smile, your eyes, your laughter… and it hurts knowing I haven't always been my best for you. Please forgive me, and keep shining that beautiful smile just for me.

I wish I could be at your door right now with flowers, your favorite chocolates, and myself, just to see you and feel the warmth of your embrace. I keep falling for you, over and over, and all I want is another chance—to hold your hands and show you that together, we can reach for the stars.

Yours always,
Mahmood`,

        `Dear Simin,

I'm really sorry, my princess. I know I haven't always been the person you deserve, and it hurts me to think I might have upset you. I hope you can forgive me… and maybe still smile that beautiful smile just for me.

I miss you more than I can say. I keep thinking about your eyes, your laughter, and the joy you bring into every moment. I wish I could be there right now, holding your hand, giving you a gentle hug, and telling you I'll do better… because you're worth it, always.

Please give me another chance. I promise I'll try my hardest, and I hope we can find our way back to those little moments that make everything feel magical.

Always,
Mahmood`
    ];

    let index = 0;
    const showNextLetter = () => {
        if (index < letters.length) {
            this.typewriterEffect(letters[index]);
            index++;

            // Wait for user click/Enter to continue
            const waitForContinue = () => {
                if (this.canAdvanceDialogue()) {
                    this.dialogueBox.onclick = () => {
                        this.dialogueBox.onclick = null;
                        showNextLetter();
                    };
                    document.onkeydown = (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            document.onkeydown = null;
                            showNextLetter();
                        }
                    };
                } else {
                    setTimeout(waitForContinue, 200);
                }
            };
            waitForContinue();
        } else {
            this.showRestartOption();
        }
    };

    showNextLetter();
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