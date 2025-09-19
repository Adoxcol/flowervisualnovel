// Visual Novel Game Engine - Fixed Version
class VisualNovel {
    constructor() {
        this.currentScene = 0;
        this.currentDialogue = 0;
		this.currentBranch = 'main'; // Track which branch we're on
		this.routeBranch = 'main';   // Track the narrative path across scenes
        this.currentTypewriterInterval = null;
        this.isProcessing = false;
        this.isWaitingForChoice = false;
        this.gameEnded = false;
        this.gameState = {
            playerName: "Simin",
            guyName: "Mahmood",
            relationship: 0,
            flags: {},
            choiceHistory: [] // Track player choices for later reference
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
        this.menuContainer = document.getElementById('menu-container');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.getElementById('loading-progress');
        this.loadingText = document.getElementById('loading-text');

        // Audio system
        this.currentMusic = null;
        this.musicVolume = 0.3;
        this.isMusicEnabled = true;

        // Load saved audio settings
        this.loadAudioSettings();

        // Initialize
        this.setupEventListeners();
        this.loadStory();
        this.showLoadingScreen();
        this.preloadBackgrounds();
    }

    // Debug: preview any ending type and route without playing through
    previewEnding(endingType = 'high', routeKey = 'love_declaration') {
        try {
            this.gameEnded = false;
            this.currentTypewriterInterval && clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
            this.characterName && (this.characterName.textContent = '');
            this.continueIndicator && (this.continueIndicator.style.display = 'none');
            this.choiceContainer && (this.choiceContainer.style.display = 'none');
            if (this.dialogueBox) {
                this.dialogueBox.style.display = 'block';
                this.dialogueBox.classList.remove('hidden');
            }
            this.routeBranch = routeKey;
            // Set flags for common route cues to personalize letters
            const f = this.gameState.flags;
            if (routeKey === 'starlight_dance') f.dance = true;
            if (routeKey === 'love_declaration') f.love_confession = true;
            if (routeKey === 'soul_connection_final') f.quiet_intimacy = true;
            if (routeKey === 'moonlit_intimacy') f.hair_touch = true;
            if (routeKey === 'grateful_heart') f.gratitude = true;
            if (routeKey === 'caring_embrace') f.deep_care = true;
            if (routeKey === 'whispered_confession') f.whispered_love = true;
            // Set relationship hints
            if (endingType === 'low') this.gameState.relationship = 1;
            else if (endingType === 'medium') this.gameState.relationship = 3;
            else this.gameState.relationship = 8;
            // Kick straight to ending
            this.showEnding();
        } catch (e) {
            console.error('previewEnding error:', e);
        }
    }

    setupEventListeners() {
        // Enhanced mobile detection for better iOS compatibility
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTouch = ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0) || 
                      (navigator.msMaxTouchPoints > 0) ||
                      (window.DocumentTouch && document instanceof window.DocumentTouch);
        
        // Force touch mode for known mobile devices even if touch detection fails
        if (this.isMobile && !this.isTouch) {
            this.isTouch = true;
        }
        
        // Button event listeners with touch support
        this.addTouchAndClickListener('start-btn', () => this.startGame());
        this.addTouchAndClickListener('continue-btn', () => this.continueGame());
        this.addTouchAndClickListener('save-btn', () => this.saveGame());
        this.addTouchAndClickListener('load-btn', () => this.loadGame());
        this.addTouchAndClickListener('settings-btn', () => this.showSettings());
        this.addTouchAndClickListener('persistent-settings-btn', () => this.showSettings());
        this.addTouchAndClickListener('skip-btn', () => this.skipDialogue());
        
        // Settings modal event listeners
        this.addTouchAndClickListener('modal-close', () => this.closeSettings());
        this.addTouchAndClickListener('toggle-music-btn', () => this.toggleMusic());
        this.addTouchAndClickListener('volume-up-btn', () => this.increaseVolume());
        this.addTouchAndClickListener('volume-down-btn', () => this.decreaseVolume());
        this.addTouchAndClickListener('skip-low-ending', () => this.skipToEnding('low'));
        this.addTouchAndClickListener('skip-medium-ending', () => this.skipToEnding('medium'));
        this.addTouchAndClickListener('skip-high-ending', () => this.skipToEnding('high'));
        
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('settings-modal');
            if (e.target === modal) {
                this.closeSettings();
            }
        });
        
        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('settings-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.closeSettings();
                }
            }
            // Debug preview endings: Ctrl+Alt+1..7
            if (e.ctrlKey && e.altKey) {
                const keyMap = {
                    '1': { ending: 'low', route: 'soul_connection_final' },
                    '2': { ending: 'medium', route: 'music_lover' },
                    '3': { ending: 'high', route: 'love_declaration' },
                    '4': { ending: 'high', route: 'starlight_dance' },
                    '5': { ending: 'high', route: 'soul_connection_final' },
                    '6': { ending: 'high', route: 'moonlit_intimacy' },
                    '7': { ending: 'high', route: 'whispered_confession' }
                };
                const cfg = keyMap[e.key];
                if (cfg) {
                    e.preventDefault();
                    this.previewEnding(cfg.ending, cfg.route);
                }
            }
        });
        
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
            
            // Skip dialogue (S key)
            if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.skipDialogue();
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
            // Enhanced touch events for mobile with better iOS compatibility
            let touchStarted = false;
            let touchStartPos = null;
            
            element.addEventListener('touchstart', (e) => {
                touchStarted = true;
                touchStartPos = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
                element.classList.add('active');
                // Only prevent default for specific cases to avoid iOS issues
                if (e.touches.length === 1) {
                    e.preventDefault();
                }
            }, { passive: false });
            
            element.addEventListener('touchmove', (e) => {
                if (touchStarted && touchStartPos) {
                    const currentTouch = e.touches[0];
                    const deltaX = Math.abs(currentTouch.clientX - touchStartPos.x);
                    const deltaY = Math.abs(currentTouch.clientY - touchStartPos.y);
                    
                    // If moved too much, cancel the touch
                    if (deltaX > 10 || deltaY > 10) {
                        touchStarted = false;
                        element.classList.remove('active');
                    }
                }
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                element.classList.remove('active');
                if (touchStarted && e.changedTouches.length === 1) {
                    e.preventDefault();
                    touchStarted = false;
                    callback();
                }
                touchStarted = false;
            }, { passive: false });
            
            element.addEventListener('touchcancel', (e) => {
                element.classList.remove('active');
                touchStarted = false;
            }, { passive: true });
        } else {
            // Click events for desktop
            element.addEventListener('click', callback);
        }
        
        // Fallback click handler for devices that support both touch and mouse
         if (this.isTouch) {
             element.addEventListener('click', (e) => {
                 // Prevent double-firing on touch devices
                 e.preventDefault();
             });
         }
     }

     removeTouchAndClickListener(element) {
         if (typeof element === 'string') {
             element = document.getElementById(element);
         }
         
         if (!element) return element;

         // Clone the element to remove all event listeners
         const newElement = element.cloneNode(true);
         element.parentNode.replaceChild(newElement, element);
         
         // Update the dialogueBox reference if this is the dialogue box
         if (element === this.dialogueBox) {
             this.dialogueBox = newElement;
         }
         
         return newElement;
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
               (!this.choiceContainer || this.choiceContainer.classList.contains('hidden') || this.choiceContainer.style.display === 'none') &&
               this.dialogueBox?.style.display !== 'none';
    }

   loadStory() {
    this.story = [
        // Scene 1: Garden Meeting with branching paths
        {
            background: 'garden',
            music: 'peaceful',
            branches: {
                main: [
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
                        { 
                            text: "Yes, I'm just visiting. This place is magical!", 
                            effect: { relationship: 1 },
                            nextBranch: 'enthusiastic'
                        },
                        { 
                            text: "I'm looking for a quiet place to think.", 
                            effect: { relationship: 0 },
                            nextBranch: 'quiet'
                        },
                        { 
                            text: "Actually, I was about to leave...", 
                            effect: { relationship: -1 },
                            nextBranch: 'leaving'
                        }
                    ] }
                ],
                
                // Branch: Player is enthusiastic about the garden
                enthusiastic: [
                    { character: this.gameState.guyName, text: "Magical is the perfect word! I've never heard anyone describe it quite like that.", portrait: 'guy' },
                    { character: 'narrator', text: "His face lights up with genuine joy, and he steps a little closer to you." },
                    { character: this.gameState.guyName, text: "You know, most people just walk through without really seeing the beauty here.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "How could they miss it? Every corner has something wonderful to discover.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood's eyes sparkle with excitement as he realizes you share his passion." },
                    { character: this.gameState.guyName, text: "Would you... would you like me to show you the secret spots? The places where the most beautiful flowers hide?", portrait: 'guy' },
                    { character: 'narrator', text: "There's hope in his voice, and you can see he's genuinely excited to share his world with you." },
                    { character: this.gameState.playerName, text: "I'd love that! Lead the way, garden keeper.", portrait: 'player' },
                    { character: 'narrator', text: "He grins widely and gestures for you to follow him deeper into the garden." },
                    // This connects to Scene 2's main branch
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],
                
                // Branch: Player wants quiet/solitude
                quiet: [
                    { character: this.gameState.guyName, text: "Oh... I understand. Sometimes the garden is the perfect place for reflection.", portrait: 'guy' },
                    { character: 'narrator', text: "He looks a bit disappointed but tries to be respectful of your space." },
                    { character: this.gameState.guyName, text: "I don't want to disturb your peace. But if you don't mind me saying...", portrait: 'guy' },
                    { character: 'narrator', text: "He pauses, seeming to gather courage." },
                    { character: this.gameState.guyName, text: "This garden has a way of helping people find what they're looking for. Even if they're not sure what that is.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "That's... actually quite wise. Maybe I do need to slow down and just... be here.", portrait: 'player' },
                    { character: 'narrator', text: "A small smile returns to his face." },
                    { character: this.gameState.guyName, text: "There's a quiet bench by the pond, if you'd like. Very peaceful. I could... show you the way?", portrait: 'guy' },
                    { character: 'narrator', text: "His offer is gentle, without any pressure." },
                    // This connects to Scene 2's quiet branch
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],
                
                // Branch: Player is about to leave
                leaving: [
                    { character: this.gameState.guyName, text: "Oh! I'm sorry, I didn't mean to keep you...", portrait: 'guy' },
                    { character: 'narrator', text: "His face falls, and he takes a step back, clearly disappointed." },
                    { character: 'narrator', text: "But as you turn to go, something makes you hesitate. Maybe it's the genuine sadness in his eyes." },
                    { character: this.gameState.guyName, text: "Wait... before you go, could you at least tell me your name?", portrait: 'guy' },
                    { character: 'narrator', text: "There's something vulnerable in his request, as if your name would be a small treasure to him." },
                    { character: this.gameState.playerName, text: "It's... it's Simin. And you're Mahmood, right?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Simin... that's beautiful. Like the flowers here.", portrait: 'guy' },
                    { character: 'narrator', text: "Despite your intention to leave, you find yourself curious about this gentle stranger." },
                    { character: this.gameState.playerName, text: "Maybe... maybe I could stay for just a few more minutes.", portrait: 'player' },
                    { character: 'narrator', text: "His face transforms with relief and quiet joy." },
                    // This connects to Scene 2's leaving branch
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],
                
                // End of scene marker
                end_scene: [
                    { character: '', text: "", nextScene: true }
                ]
            }
        },

        // Scene 2: Music & Interests - continuing the branch paths
        {
            background: 'garden',
            music: 'gentle',
            branches: {
                // Main path (from enthusiastic choice)
                main: [
					{ character: this.gameState.guyName, text: "Here's my favorite spot - the rose arbor. I planted these myself.", portrait: 'guy' },
					{ character: 'narrator', text: "He smiles a little brighter if he remembers your earlier touch.", minRelationship: 3, condition: ({ state }) => !!state.flags.hair_touch },
                    { character: 'narrator', text: "You walk through an archway covered in climbing roses of every color." },
                    { character: this.gameState.playerName, text: "This is incredible! You have such a gift.", portrait: 'player' },
                    { character: this.gameState.guyName, text: "When I work here, I usually listen to music. It helps me connect with the plants.", portrait: 'guy' },
                    { character: 'narrator', text: "He hums a soft melody as he adjusts a wayward rose stem." },
                    { character: '', text: "How do you respond to his music?", choices: [
                        { 
                            text: "That's beautiful! What song is that?", 
                            effect: { relationship: 2 },
                            nextBranch: 'music_lover'
                        },
                        { 
                            text: "Music and gardening - interesting combination.", 
                            effect: { relationship: 1 },
                            nextBranch: 'curious'
                        },
                        { 
                            text: "I prefer working in silence myself.", 
                            effect: { relationship: -1 },
                            nextBranch: 'different_styles'
                        }
                    ] }
                ],
                
                // From quiet choice (Scene 1)
                quiet: [
                    { character: 'narrator', text: "Mahmood leads you to a secluded bench beside a small pond." },
                    { character: 'narrator', text: "Water lilies float peacefully on the surface, and dragonflies dance in the afternoon light." },
                    { character: this.gameState.guyName, text: "Sometimes I come here when I need to think. The water has a calming effect.", portrait: 'guy' },
                    { character: 'narrator', text: "You sit in comfortable silence for a moment, both of you watching the gentle ripples." },
                    { character: this.gameState.playerName, text: "Thank you for understanding. Not everyone appreciates the value of quiet moments.", portrait: 'player' },
                    { character: this.gameState.guyName, text: "In my line of work, you learn to listen to what isn't being said out loud.", portrait: 'guy' },
                    { character: 'narrator', text: "His words resonate with you in an unexpected way." },
                    { character: '', text: "How do you continue?", choices: [
                        { 
                            text: "Share a personal thought about finding peace", 
                            effect: { relationship: 2, tag: 'soul_connection' },
                            nextBranch: 'soul_connection'
                        },
                        { 
                            text: "Ask about what brings him joy in life", 
                            effect: { relationship: 1, tag: 'joy_discovery' },
                            nextBranch: 'joy_discovery'
                        }
                    ] }
                ],
                
                // From leaving choice (Scene 1)
                leaving: [
                    { character: this.gameState.guyName, text: "I know you were about to go, but... could I show you just one thing? It'll only take a moment.", portrait: 'guy' },
                    { character: 'narrator', text: "There's an earnest hope in his voice that's hard to resist." },
                    { character: this.gameState.playerName, text: "Alright, but just one thing.", portrait: 'player' },
                    { character: 'narrator', text: "He leads you to a small greenhouse tucked away behind some trees." },
                    { character: this.gameState.guyName, text: "This is where I grow the rare orchids. Most people never see these.", portrait: 'guy' },
                    { character: 'narrator', text: "Inside, exotic flowers bloom in impossible colors, their beauty taking your breath away." },
                    { character: this.gameState.playerName, text: "Oh my... these are extraordinary. Why do you keep them hidden?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "Because... some beautiful things are meant to be discovered, not displayed.", portrait: 'guy' },
                    { character: 'narrator', text: "The way he looks at you while saying this makes your heart skip a beat." },
                    { character: '', text: "His honesty hangs in the air—how do you answer?", choices: [
                        { 
                            text: "Say his gentleness makes you want to stay", 
                            effect: { relationship: 2, tag: 'vulnerability_bond' },
                            nextBranch: 'vulnerability_bond'
                        },
                        { 
                            text: "Confess you almost left—but his warmth kept you", 
                            effect: { relationship: 1, tag: 'honest_confession' },
                            nextBranch: 'honest_confession'
                        }
                    ] }
                ],

                // Music lover branch
				music_lover: [
                    { character: this.gameState.guyName, text: "It's an old folk song my grandmother used to sing. She taught me that music helps flowers grow.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "That's so sweet! I'd love to hear more of it. You have such good taste in music.", portrait: 'player' },
                    { character: 'narrator', text: "He starts humming again, this time more confidently, his eyes never leaving your face." },
					{ character: 'narrator', text: "He seems especially moved by your voice after your earlier singing.", minRelationship: 4, condition: ({ state }) => state.flags.whispered_love || state.flags.quiet_intimacy },
                    { character: this.gameState.guyName, text: "Do you play any instruments? Or sing? Your voice has such a beautiful tone to it.", portrait: 'guy' },
                    { character: 'narrator', text: "There's genuine curiosity in his question, as if discovering your musical soul would complete some puzzle." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // Curious branch
                curious: [
                    { character: this.gameState.guyName, text: "It might sound silly, but I believe plants respond to emotions in music.", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "That doesn't sound silly at all. There's something beautiful about that connection.", portrait: 'player' },
                    { character: 'narrator', text: "His face lights up with relief that you don't think he's strange." },
                    { character: this.gameState.guyName, text: "Would you like to try it? I have some headphones we could share... Your smile when you're curious about something is absolutely radiant.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // Different styles branch
                different_styles: [
                    { character: this.gameState.guyName, text: "I can understand that. Everyone has their own way of finding focus.", portrait: 'guy' },
                    { character: 'narrator', text: "Though he tries to hide it, you can see he's a bit deflated by your response." },
                    { character: this.gameState.playerName, text: "But I'm curious about your approach. Maybe you could show me sometime?", portrait: 'player' },
                    { character: 'narrator', text: "Hope returns to his eyes at your willingness to understand his methods." },
                    { character: this.gameState.guyName, text: "Your open mind... the way your eyes light up with genuine curiosity... it's wonderful.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // New sub-branches from quiet path
                soul_connection: [
                    { character: this.gameState.playerName, text: "Sometimes I feel like I'm always searching for something... a connection, a sense of belonging.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood nods deeply, his eyes reflecting understanding and compassion." },
                    { character: this.gameState.guyName, text: "Your voice when you speak from your heart... it's the most beautiful thing I've ever heard. And your eyes when you're vulnerable like this... they touch my soul.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair catches the light as he leans closer, completely focused on you." },
                    { character: this.gameState.playerName, text: "The way you listen, the way your hair frames your face when you're thinking deeply... it's mesmerizing. Your smile gives me hope.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                joy_discovery: [
                    { character: this.gameState.guyName, text: "You want to know what brings me joy? Right now, it's watching your eyes light up when you're curious about something.", portrait: 'guy' },
                    { character: 'narrator', text: "His honesty makes your heart race." },
                    { character: this.gameState.playerName, text: "And your smile... the way it transforms your whole face. It's absolutely captivating. Your hair looks so good when you're happy.", portrait: 'player' },
                    { character: 'narrator', text: "He grins, unconsciously running his hand through his hair in that endearing way." },
                    { character: this.gameState.guyName, text: "Your laugh, your voice, the way you make everything feel brighter... you bring me so much joy. Your eyes when you're happy... they're like starlight.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // New sub-branches from leaving path
                vulnerability_bond: [
                    { character: this.gameState.playerName, text: "There's something about your gentleness... it makes me want to stay and discover more.", portrait: 'player' },
                    { character: 'narrator', text: "His eyes fill with emotion, and he unconsciously touches his hair nervously." },
                    { character: this.gameState.guyName, text: "I was so afraid you'd think I was just some boring gardener. But your eyes... they see something in me I didn't even know was there. Your voice when you're sincere like this... it heals something in me.", portrait: 'guy' },
                    { character: 'narrator', text: "The vulnerability in his confession creates an intimate bond between you." },
                    { character: this.gameState.playerName, text: "Your hair, your smile, your gentle soul... you're anything but boring. That sweet way you touch your hair when you're nervous is adorable.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                honest_confession: [
                    { character: this.gameState.playerName, text: "I have to be honest... I almost left because I was scared of feeling something real.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood's expression becomes incredibly tender and understanding." },
                    { character: this.gameState.guyName, text: "Your honesty is so refreshing. And your voice when you're being real like this... it touches my heart. Your eyes when you're vulnerable... they're breathtaking.", portrait: 'guy' },
                    { character: 'narrator', text: "He reaches up to brush his hair from his eyes, a gesture that's becoming endearingly familiar." },
                    { character: this.gameState.playerName, text: "But then you smiled, and ran your hand through that perfect messy hair, and I couldn't take another step away. Your smile is my weakness.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // End of scene marker
                end_scene: [
                    { character: '', text: "", nextScene: true }
                ]
            }
        },

        // Scene 3: Café - branches continue
        {
            background: 'cafe',
            music: 'cozy',
            branches: {
                // Main path (from enthusiastic/music choices)
                main: [
                    { character: 'narrator', text: "Your conversation flows naturally as you walk to a nearby café." },
                    { character: this.gameState.guyName, text: "The owner here lets me bring flowers for the tables. I thought you might enjoy the atmosphere.", portrait: 'guy' },
                    { character: 'narrator', text: "The café is warm and inviting, with fresh flowers on every table - clearly Mahmood's work." },
                    { character: this.gameState.playerName, text: "It's perfect. You have such a good eye for beauty. And that smile when you're proud of your work...", portrait: 'player' },
                    { character: 'narrator', text: "As you sit across from each other, you notice how the afternoon light catches in his messy hair, making it shine." },
                    { character: this.gameState.guyName, text: "Your voice... it has such a lovely melody to it. Like music itself. And your eyes when you appreciate something beautiful... they sparkle.", portrait: 'guy' },
                    { character: 'narrator', text: "He runs his hand through his hair nervously, making it even more endearingly tousled." },
                    { character: this.gameState.playerName, text: "And your smile... it makes everything feel warmer somehow. Plus that hair of yours is absolutely perfect when you mess it up like that.", portrait: 'player' },
                    { character: '', text: "What happens next?", choices: [
                        { 
							text: "Reach out and gently fix his messy hair", 
							effect: { relationship: 2, tag: 'hair_touch' },
                            nextBranch: 'intimate'
                        },
                        { 
                            text: "Ask him to tell you more about his music", 
                            effect: { relationship: 1 },
                            nextBranch: 'music_deep'
                        },
                        { 
                            text: "Suggest exploring more of the town together", 
                            effect: { relationship: 1 },
                            nextBranch: 'adventure'
                        }
                    ] }
                ],
                
                // From quiet path (Scene 2)
				quiet: [
                    // If quiet path was already deepened in Scene 2, jump to final to avoid repeating the question
                    { character: '', text: '', condition: ({ state }) => !!(state.flags.soul_connection || state.flags.joy_discovery), nextBranch: 'quiet_router' },
                    { character: 'narrator', text: "After your peaceful moment by the pond, Mahmood suggests a quiet café nearby." },
                    { character: this.gameState.guyName, text: "There's a corner table where we could continue our conversation... or enjoy the silence.", portrait: 'guy' },
                    { character: 'narrator', text: "You appreciate how he gives you options without pressure." },
                    { character: 'narrator', text: "The café has a contemplative atmosphere, with soft classical music playing in the background." },
                    { character: this.gameState.playerName, text: "This is perfect. Sometimes the best conversations happen in comfortable silence. And I love how your hair looks in this lighting.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood's eyes light up with understanding, and you notice how expressive they are." },
					{ character: 'narrator', text: "He seems more open to touch after your earlier intimacy.", minRelationship: 3, condition: ({ state }) => !!state.flags.hair_touch },
                    { character: this.gameState.guyName, text: "Your eyes... they're so thoughtful. I can see there's so much depth behind them. And your voice, even when quiet, has this gentle quality that soothes my soul.", portrait: 'guy' },
                    { character: 'narrator', text: "You feel yourself blushing at his sincere observation." },
                    { character: this.gameState.playerName, text: "Your hair has this way of catching the light... it's quite distracting actually. In the best way.", portrait: 'player' },
                    { character: 'narrator', text: "He touches his hair self-consciously, making it fall across his forehead in the most charming way." },
                    { character: '', text: "How do you continue this intimate moment?", choices: [
                        { 
                            text: "Tell me more about your love with peace", 
                            effect: { relationship: 2 },
                            nextBranch: 'soul_connection_final'
                        },
                        { 
                            text: "Tell me more about your chase with joy", 
                            effect: { relationship: 1 },
                            nextBranch: 'joy_discovery_final'
                        }
                    ] }
                ],
                
                // From leaving path (Scene 2)
                leaving: [
                    // If leaving path was already deepened in Scene 2, jump to final to avoid repeating the question
                    { character: '', text: '', condition: ({ state }) => !!(state.flags.vulnerability_bond || state.flags.honest_confession), nextBranch: 'leaving_router' },
                    { character: 'narrator', text: "After seeing the orchids, you find yourself genuinely curious about Mahmood." },
                    { character: this.gameState.playerName, text: "I... I think I'd like to know more about you and your garden.", portrait: 'player' },
                    { character: 'narrator', text: "His face breaks into the most radiant smile you've ever seen." },
                    { character: this.gameState.guyName, text: "Really? You... you want to stay?", portrait: 'guy' },
                    { character: 'narrator', text: "There's such genuine surprise and joy in his voice that it makes your heart flutter." },
                    { character: this.gameState.playerName, text: "That smile of yours is impossible to walk away from. And when you run your hand through your hair like that...", portrait: 'player' },
                    { character: 'narrator', text: "He ducks his head shyly, his hair falling into his eyes." },
                    { character: this.gameState.guyName, text: "And your laugh... when you laughed earlier, it was like hearing sunshine. Your eyes when you're amused... they're breathtaking.", portrait: 'guy' },
                    { character: 'narrator', text: "The vulnerability in his confession makes you see him in a completely new light." },
                    { character: '', text: "How do you respond to his openness?", choices: [
                        { 
                            text: "Tell him how his gentleness draws you in", 
                            effect: { relationship: 2 },
                            nextBranch: 'vulnerability_bond_final'
                        },
                        { 
                            text: "Admit you almost left but couldn't", 
                            effect: { relationship: 1 },
                            nextBranch: 'honest_confession_final'
                        }
                    ] }
                ],
                // Router branches to direct to proper finals without duplicate questions
                quiet_router: [
                    { character: '', text: '', condition: ({ state }) => !!state.flags.soul_connection, nextBranch: 'soul_connection_final' },
                    { character: '', text: '', condition: ({ state }) => !!state.flags.joy_discovery, nextBranch: 'joy_discovery_final' },
                    { character: '', text: '', nextBranch: 'quiet' }
                ],
                leaving_router: [
                    { character: '', text: '', condition: ({ state }) => !!state.flags.vulnerability_bond, nextBranch: 'vulnerability_bond_final' },
                    { character: '', text: '', condition: ({ state }) => !!state.flags.honest_confession, nextBranch: 'honest_confession_final' },
                    { character: '', text: '', nextBranch: 'leaving' }
                ],
                

                // New branches from Scene 2 choices
                music_lover: [
                    { character: 'narrator', text: "Your shared love of music creates an instant connection as you walk to the café." },
                    { character: this.gameState.guyName, text: "I have to ask... do you sing? Your speaking voice is so melodic.", portrait: 'guy' },
                    { character: 'narrator', text: "His attention to the nuances of your voice makes you feel truly heard." },
                    { character: this.gameState.playerName, text: "Sometimes, when I'm alone. Your hair looks like it belongs in a music video, all windswept and perfect. And your taste in music is incredible.", portrait: 'player' },
                    { character: 'narrator', text: "He laughs, unconsciously running his fingers through his hair." },
                    { character: this.gameState.guyName, text: "Would you... would you hum something for me? I'd love to hear your voice in song. Your joy when you talk about music... it's infectious.", portrait: 'guy' },
                    { character: 'narrator', text: "The way he asks is so gentle, like he's requesting something precious." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                curious: [
                    { character: 'narrator', text: "Your curiosity about his methods leads to deeper conversation over coffee." },
                    { character: this.gameState.guyName, text: "I love how your mind works. The way you listen... it's like you hear more than just words. Your eyes when you're really paying attention... they're so beautiful.", portrait: 'guy' },
                    { character: 'narrator', text: "His appreciation for your attentiveness makes you feel valued in a way you haven't experienced before." },
                    { character: this.gameState.playerName, text: "And I love watching you talk about your passions. Your whole face lights up, especially your smile. Plus that messy hair suits you perfectly.", portrait: 'player' },
                    { character: 'narrator', text: "He grins, and you notice how his smile makes his eyes crinkle adorably at the corners." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                different_styles: [
                    { character: 'narrator', text: "Despite your different approaches, you find common ground at the café." },
                    { character: this.gameState.guyName, text: "You know what I admire about you? Your honesty. Your eyes don't hide anything - they're so genuine. And your voice when you speak your mind... it's captivating.", portrait: 'guy' },
                    { character: 'narrator', text: "His observation touches something deep in you." },
                    { character: this.gameState.playerName, text: "And your hair... it's like you don't even know how attractive you are when it falls in your face like that. Your smile is so genuine too.", portrait: 'player' },
                    { character: 'narrator', text: "He blushes deeply, touching his hair with surprised delight." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // New sub-branches
                intimate: [
					{ character: 'narrator', text: "You reach out gently, your fingers brushing through his soft, messy hair." },
                    { character: this.gameState.guyName, text: "Oh... that feels... really nice actually. Your touch is so gentle.", portrait: 'guy' },
                    { character: 'narrator', text: "His eyes flutter closed for a moment, completely trusting and vulnerable." },
                    { character: this.gameState.playerName, text: "Your hair is so soft. I couldn't resist. It looks perfect like this.", portrait: 'player' },
                    { character: 'narrator', text: "When he opens his eyes, they're filled with such tender affection it takes your breath away." },
					{ character: this.gameState.guyName, text: "The way you look at me... your eyes are so beautiful, so warm. I could get lost in them. And your voice when you whisper like that... it sends shivers through me.", portrait: 'guy' },
					{ character: 'narrator', text: "This tenderness sticks with him into the evening.", minRelationship: 4, condition: ({ state }) => !!state.flags.hair_touch },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                music_deep: [
                    { character: this.gameState.guyName, text: "Music is like... it's the language of everything I can't put into words.", portrait: 'guy' },
                    { character: 'narrator', text: "He starts humming softly, his voice rich and soothing." },
                    { character: this.gameState.playerName, text: "Your voice is incredible. And the way your hair moves when you get passionate about something... it's mesmerizing. Your musical taste is so sophisticated.", portrait: 'player' },
                    { character: 'narrator', text: "He runs his hand through his hair, making it fall perfectly across his forehead." },
                    { character: this.gameState.guyName, text: "Your laugh when you tease me... it's my new favorite sound in the world. And the way your eyes dance with mischief... you're enchanting.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                adventure: [
                    { character: this.gameState.guyName, text: "I'd love to show you more places! There's so much beauty around here that people miss.", portrait: 'guy' },
                    { character: 'narrator', text: "His enthusiasm is infectious, and his smile is radiant." },
                    { character: this.gameState.playerName, text: "With a smile like that, how could I say no? And your hair in this light... it's like spun gold.", portrait: 'player' },
                    { character: 'narrator', text: "He touches his hair shyly, not used to compliments but clearly loving them." },
                    { character: this.gameState.guyName, text: "The joy in your voice when you get excited... it makes everything feel more alive. Your eyes sparkle with such enthusiasm.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                soul_connection_final: [
                    { character: this.gameState.playerName, text: "Sometimes I feel like I'm always searching for something... a connection, a sense of belonging.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood nods deeply, his eyes reflecting understanding and compassion." },
                    { character: this.gameState.guyName, text: "Your voice when you speak from your heart... it's the most beautiful thing I've ever heard. And your eyes when you're vulnerable like this... they touch my soul.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair catches the light as he leans closer, completely focused on you." },
                    { character: this.gameState.playerName, text: "The way you listen, the way your hair frames your face when you're thinking deeply... it's mesmerizing. Your smile gives me hope.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                joy_discovery_final: [
                    { character: this.gameState.guyName, text: "You want to know what brings me joy? Right now, it's watching your eyes light up when you're curious about something.", portrait: 'guy' },
                    { character: 'narrator', text: "His honesty makes your heart race." },
                    { character: this.gameState.playerName, text: "And your smile... the way it transforms your whole face. It's absolutely captivating. Your hair looks so good when you're happy.", portrait: 'player' },
                    { character: 'narrator', text: "He grins, unconsciously running his hand through his hair in that endearing way." },
                    { character: this.gameState.guyName, text: "Your laugh, your voice, the way you make everything feel brighter... you bring me so much joy. Your eyes when you're happy... they're like starlight.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                vulnerability_bond_final: [
                    { character: this.gameState.playerName, text: "There's something about your gentleness... it makes me want to stay and discover more.", portrait: 'player' },
                    { character: 'narrator', text: "His eyes fill with emotion, and he unconsciously touches his hair nervously." },
                    { character: this.gameState.guyName, text: "I was so afraid you'd think I was just some boring gardener. But your eyes... they see something in me I didn't even know was there. Your voice when you're sincere like this... it heals something in me.", portrait: 'guy' },
                    { character: 'narrator', text: "The vulnerability in his confession creates an intimate bond between you." },
                    { character: this.gameState.playerName, text: "Your hair, your smile, your gentle soul... you're anything but boring. That sweet way you touch your hair when you're nervous is adorable.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                honest_confession_final: [
                    { character: this.gameState.playerName, text: "I have to be honest... I almost left because I was scared of feeling something real.", portrait: 'player' },
                    { character: 'narrator', text: "Mahmood's expression becomes incredibly tender and understanding." },
                    { character: this.gameState.guyName, text: "Your honesty is so refreshing. And your voice when you're being real like this... it touches my heart. Your eyes when you're vulnerable... they're breathtaking.", portrait: 'guy' },
                    { character: 'narrator', text: "He reaches up to brush his hair from his eyes, a gesture that's becoming endearingly familiar." },
                    { character: this.gameState.playerName, text: "But then you smiled, and ran your hand through that perfect messy hair, and I couldn't take another step away. Your smile is my weakness.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // End of scene marker
                end_scene: [
                    { character: '', text: "", nextScene: true }
                ]
            }
        },

        // Scene 4: Rocky Moment - Enhanced with all branches
        {
            background: 'park',
            music: 'tense',
            branches: {
                main: [
                    { character: 'narrator', text: "As the sun begins to set, a moment of uncertainty settles between you." },
                    { character: 'narrator', text: "You're sitting on a park bench, the golden light making his hair look like spun gold." },
                    { character: this.gameState.guyName, text: "Sometimes I wonder... am I just boring you? Maybe you're just being polite.", portrait: 'guy' },
                    { character: 'narrator', text: "His voice wavers with insecurity, and he won't meet your eyes." },
                    { character: this.gameState.playerName, text: "What? Why would you think that?", portrait: 'player' },
                    { character: this.gameState.guyName, text: "I see how your eyes light up when you talk about other things... maybe I'm not interesting enough.", portrait: 'guy' },
                    { character: '', text: "How do you reassure him?", choices: [
                        { 
                            text: "Tell him his passion for beauty makes him fascinating", 
                            effect: { relationship: 2 },
                            nextBranch: 'passionate_reassurance'
                        },
                        { 
                            text: "Admit that you've been falling for him all day", 
                            effect: { relationship: 3 },
                            nextBranch: 'love_confession'
                        },
                        { 
                            text: "Show him through gentle touch that you care", 
                            effect: { relationship: 2 },
                            nextBranch: 'tender_touch'
                        }
                    ] }
                ],

                // All other branches lead to the same rocky moment but with different contexts
                quiet: [
                    { character: 'narrator', text: "Despite your peaceful connection, doubt creeps into Mahmood's mind as evening approaches." },
                    { character: this.gameState.guyName, text: "I keep thinking... maybe you really did just want to be alone, and I've been intruding this whole time.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair falls into his face as he looks down, masking his vulnerability." },
                    { character: this.gameState.playerName, text: "Mahmood, no... that's not it at all.", portrait: 'player' },
                    { character: '', text: "How do you reassure this gentle soul?", choices: [
                        { 
                            text: "Tell him he gave you exactly the peace you needed", 
                            effect: { relationship: 2 },
                            nextBranch: 'peace_found'
                        },
                        { 
                            text: "Confess that being with him feels like coming home", 
                            effect: { relationship: 3 },
                            nextBranch: 'home_feeling'
                        }
                    ] }
                ],

                leaving: [
                    { character: 'narrator', text: "Even after choosing to stay, Mahmood's earlier rejection still haunts him." },
                    { character: this.gameState.guyName, text: "You were ready to leave before... maybe you're having second thoughts about staying?", portrait: 'guy' },
                    { character: 'narrator', text: "He runs his hand through his hair anxiously, the gesture you've grown to love now tinged with worry." },
                    { character: '', text: "How do you address his fear?", choices: [
                        { 
                            text: "Explain that leaving was about fear, not disinterest", 
                            effect: { relationship: 2 },
                            nextBranch: 'fear_explanation'
                        },
                        { 
                            text: "Show him he's worth staying for", 
                            effect: { relationship: 3 },
                            nextBranch: 'worth_staying'
                        }
                    ] }
                ],

                // Resolution branches
                passionate_reassurance: [
                    { character: this.gameState.playerName, text: "Are you kidding? Your passion for beauty, the way your eyes light up when you talk about your garden... it's captivating.", portrait: 'player' },
                    { character: 'narrator', text: "He looks up, hope flickering in his eyes, his hair catching the dying sunlight." },
                    { character: this.gameState.guyName, text: "Really? Your voice when you say things like that... it makes me believe in myself again. And your eyes when you look at me like that... they give me strength.", portrait: 'guy' },
                    { character: 'narrator', text: "Relief washes over his features, and that beautiful smile returns." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                love_confession: [
					{ character: this.gameState.playerName, text: "Mahmood... I think I've been falling for you all day. Your smile, your hair, your gentle heart...", portrait: 'player' },
                    { character: 'narrator', text: "His eyes widen in shock and joy, his hand automatically going to his hair." },
					{ character: this.gameState.guyName, text: "You... you have feelings for me? Your eyes, your laugh, your beautiful voice... I thought I was dreaming. Your joy, your curiosity... they've captured my heart.", portrait: 'guy' },
					{ character: 'narrator', text: "His confidence will be higher later if you confessed under the stars before.", minRelationship: 6, condition: ({ state }) => state.flags.whispered_love },
                    { character: 'narrator', text: "The confession hangs between you like a bridge to something beautiful." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                tender_touch: [
                    { character: 'narrator', text: "Without words, you reach out and gently touch his cheek, brushing his hair aside." },
                    { character: this.gameState.guyName, text: "Oh... that touch... your eyes are so gentle, so caring. Your voice doesn't need words to comfort me.", portrait: 'guy' },
                    { character: 'narrator', text: "He leans into your touch, his self-doubt melting away under your tenderness." },
                    { character: this.gameState.playerName, text: "Your hair, your smile, everything about you draws me in. Don't doubt that.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                peace_found: [
                    { character: this.gameState.playerName, text: "You didn't intrude. You gave me exactly what I needed - peace, understanding, and your beautiful presence.", portrait: 'player' },
                    { character: 'narrator', text: "His shoulders relax, and he pushes his hair back with visible relief." },
                    { character: this.gameState.guyName, text: "Your voice, the way you speak with such sincerity... it heals something in me. Your eyes when you're grateful... they're like warm sunlight.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                home_feeling: [
                    { character: this.gameState.playerName, text: "Being with you feels like coming home, Mahmood. Your smile, your gentle soul... it's everything I didn't know I was searching for.", portrait: 'player' },
                    { character: 'narrator', text: "Tears of joy well up in his eyes as he processes your heartfelt words." },
                    { character: this.gameState.guyName, text: "You make me feel seen, heard... your eyes see straight to my soul. Your voice when you speak from your heart... it's the most beautiful music.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                fear_explanation: [
                    { character: this.gameState.playerName, text: "I was leaving because I was scared of these feelings. But your smile, your kindness... they made me brave.", portrait: 'player' },
                    { character: 'narrator', text: "Understanding dawns in his eyes, followed by tender affection." },
                    { character: this.gameState.guyName, text: "Your courage, your honesty... your beautiful voice speaking these truths... you amaze me. Your eyes when you're vulnerable... they touch my heart.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                worth_staying: [
                    { character: this.gameState.playerName, text: "You are absolutely worth staying for. Your hair in the sunlight, your laugh, your gentle heart... you're extraordinary.", portrait: 'player' },
                    { character: 'narrator', text: "He reaches up to touch his hair self-consciously, a smile breaking across his face." },
                    { character: this.gameState.guyName, text: "The way you see me... your eyes make me feel like I could be someone special. Your voice when you believe in me... it changes everything.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // Alias branches to maintain sub-branch flow without repeating earlier questions
                vulnerability_bond_final: [
                    { character: 'narrator', text: "The bond formed through vulnerability guides your evening conversation." },
                    { character: '', text: "", nextBranch: 'leaving' }
                ],
                honest_confession_final: [
                    { character: 'narrator', text: "Your earlier honesty shapes this delicate moment between you." },
                    { character: '', text: "", nextBranch: 'leaving' }
                ],
                soul_connection_final: [
                    { character: 'narrator', text: "That deep, quiet connection colors everything you say tonight." },
                    { character: '', text: "", nextBranch: 'quiet' }
                ],
                joy_discovery_final: [
                    { character: 'narrator', text: "The joy you discovered together gives courage to your words now." },
                    { character: '', text: "", nextBranch: 'quiet' }
                ],
                music_lover: [
                    { character: 'narrator', text: "Shared music earlier still plays between you like a heartbeat." },
                    { character: '', text: "", nextBranch: 'main' }
                ],
                curious: [
                    { character: 'narrator', text: "Your curiosity from before keeps opening doors in this moment." },
                    { character: '', text: "", nextBranch: 'main' }
                ],
                different_styles: [
                    { character: 'narrator', text: "Different approaches, same pull—tonight it draws you closer." },
                    { character: '', text: "", nextBranch: 'main' }
                ],
                intimate: [
                    { character: 'narrator', text: "The memory of your gentle touch lingers between you." },
                    { character: '', text: "", nextBranch: 'main' }
                ],
                music_deep: [
                    { character: 'narrator', text: "His thoughts return to how deeply you felt the music together." },
                    { character: '', text: "", nextBranch: 'main' }
                ],
                adventure: [
                    { character: 'narrator', text: "The day’s shared adventure gives you both a brave heart tonight." },
                    { character: '', text: "", nextBranch: 'main' }
                ],

                // End of scene marker
                end_scene: [
                    { character: '', text: "", nextScene: true }
                ]
            }
        },

        // Scene 5: Romantic Night - Final scene with all branches converging
        {
            background: 'evening',
            music: 'romantic',
            branches: {
                main: [
                    { character: 'narrator', text: "Under a canopy of stars, you and Mahmood walk slowly through the moonlit garden." },
                    { character: 'narrator', text: "The night air is filled with the scent of jasmine, and his hair looks silver in the moonlight." },
                    { character: this.gameState.guyName, text: "Today has been like a dream. Your smile, your laugh... they've made everything magical.", portrait: 'guy' },
                    { character: 'narrator', text: "He stops walking and turns to face you completely, his expression soft with affection." },
                    { character: this.gameState.playerName, text: "And your music, your passion, that adorable way your hair falls in your face... you've enchanted me.", portrait: 'player' },
                    { character: 'narrator', text: "A shooting star streaks across the sky above you." },
                    { character: this.gameState.guyName, text: "Make a wish...", portrait: 'guy' },
                    { character: this.gameState.playerName, text: "I don't need to. Everything I could wish for is right here.", portrait: 'player' },
                    { character: 'narrator', text: "His eyes fill with emotion as he reaches up to gently touch your face." },
                    { character: this.gameState.guyName, text: "Your eyes in the starlight... they're the most beautiful thing I've ever seen. And your voice saying those words... it's pure magic. Your joy, your spirit... they light up my world.", portrait: 'guy' },
                    { character: '', text: "This perfect moment calls for...?", choices: [
                        { 
                            text: "Take his hand and dance under the stars", 
                            effect: { relationship: 3, gesture: 'dance' },
                            nextBranch: 'starlight_dance'
                        },
                        { 
                            text: "Tell him you're falling in love with him", 
                            effect: { relationship: 4, gesture: 'love_confession' },
                            nextBranch: 'love_declaration'
                        },
                        { 
                            text: "Gently run your fingers through his moonlit hair", 
                            effect: { relationship: 3, gesture: 'hair_touch' },
                            nextBranch: 'moonlit_intimacy'
                        }
                    ] }
                ],

				// Aliases from Scene 4 resolutions to ensure route persistence
				passionate_reassurance: [
					{ character: 'narrator', text: "The confidence you gave him carries into the night." },
					{ character: '', text: '', nextBranch: 'starlight_dance' }
				],
				love_confession: [
					{ character: 'narrator', text: "Your earlier confession blossoms fully under the stars." },
					{ character: '', text: '', nextBranch: 'love_declaration' }
				],
				tender_touch: [
					{ character: 'narrator', text: "That gentle touch returns in the moonlight." },
					{ character: '', text: '', nextBranch: 'moonlit_intimacy' }
				],
				peace_found: [
					{ character: 'narrator', text: "The peace you found together deepens tonight." },
					{ character: '', text: '', nextBranch: 'soul_connection_final' }
				],
				home_feeling: [
					{ character: 'narrator', text: "Coming home to each other becomes undeniable." },
					{ character: '', text: '', nextBranch: 'love_declaration' }
				],
				fear_explanation: [
					{ character: 'narrator', text: "Your honesty about fear transforms into gratitude." },
					{ character: '', text: '', nextBranch: 'grateful_heart' }
				],
				worth_staying: [
					{ character: 'narrator', text: "Choosing to stay leads to a loving embrace." },
					{ character: '', text: '', nextBranch: 'caring_embrace' }
				],

                // All other branches converge to similar romantic conclusions
                quiet: [
                    { character: 'narrator', text: "The peaceful energy you've shared all day culminates in this perfect starlit moment." },
                    { character: this.gameState.guyName, text: "You gave me the gift of understanding today. Your voice, your gentle presence... you've touched my soul.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair glows silver in the moonlight as he looks at you with deep affection." },
                    { character: this.gameState.playerName, text: "And you showed me that silence can be the most beautiful conversation. Your smile, your thoughtful eyes... they speak to my heart.", portrait: 'player' },
                    { character: '', text: "In this moment of perfect understanding...", choices: [
                        { 
                            text: "Share a quiet, intimate moment together", 
                            effect: { relationship: 4, gesture: 'quiet_intimacy' },
                            nextBranch: 'soul_connection_final'
                        },
                        { 
                            text: "Whisper your feelings under the stars", 
                            effect: { relationship: 3, gesture: 'whispered_love' },
                            nextBranch: 'whispered_confession'
                        }
                    ] }
                ],

                leaving: [
                    { character: 'narrator', text: "What began as an almost-goodbye has transformed into the most romantic evening of your life." },
                    { character: this.gameState.guyName, text: "I almost lost you today... but your eyes, your beautiful heart, they saw something worth staying for.", portrait: 'guy' },
                    { character: 'narrator', text: "He runs his hand through his hair, that gesture now so dear to you." },
                    { character: this.gameState.playerName, text: "Your smile convinced me to stay. Your laugh, your gentle soul... they captured my heart completely. That messy hair of yours is absolutely perfect.", portrait: 'player' },
                    { character: '', text: "How do you seal this transformation?", choices: [
                        { 
                            text: "Tell him you're grateful you stayed", 
                            effect: { relationship: 3, gesture: 'gratitude' },
                            nextBranch: 'grateful_heart'
                        },
                        { 
                            text: "Show him how deeply you care", 
                            effect: { relationship: 4, gesture: 'deep_care' },
                            nextBranch: 'caring_embrace'
                        }
                    ] }
                ],

                // Final romantic conclusions
                starlight_dance: [
                    { character: 'narrator', text: "You take his hand and begin to sway together under the starlight, no music needed." },
                    { character: this.gameState.guyName, text: "Your hand in mine feels so right... and the joy in your eyes as we dance... it's pure magic. Your voice humming softly... it's the most beautiful melody.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair catches the starlight as he spins you gently, both of you laughing with pure happiness." },
                    { character: this.gameState.playerName, text: "Your laugh, your smile, the way your hair moves in the night breeze... this is perfect. Your musical taste, your gentle heart... I'm completely enchanted.", portrait: 'player' },
                    { character: 'narrator', text: "As you dance among the flowers, you both know this is the beginning of something beautiful and eternal." },
                    { character: this.gameState.guyName, text: "Your eyes when you look at me... they make me believe in fairy tales. Your voice, your laughter... they're the soundtrack to my dreams.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                love_declaration: [
                    { character: this.gameState.playerName, text: "Mahmood... I think I'm falling in love with you. Your music, your smile, your beautiful soul... everything about you captivates me.", portrait: 'player' },
                    { character: 'narrator', text: "His eyes fill with tears of joy, and he reaches up to touch his hair nervously." },
                    { character: this.gameState.guyName, text: "I love you too... your voice saying those words, your eyes shining with such feeling... I love everything about you. Your joy, your curiosity, your beautiful spirit... you've stolen my heart completely.", portrait: 'guy' },
                    { character: 'narrator', text: "Under the stars, your love confession creates a moment of pure, perfect romance." },
                    { character: this.gameState.playerName, text: "Your hair in the moonlight, your gentle touch, that incredible smile... I never want this moment to end.", portrait: 'player' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                moonlit_intimacy: [
                    { character: 'narrator', text: "You reach up and gently run your fingers through his silver-moonlit hair." },
                    { character: this.gameState.guyName, text: "The way you touch me... your eyes so full of tenderness... I've never felt so cared for. Your voice when you whisper... it sends shivers through my soul.", portrait: 'guy' },
                    { character: 'narrator', text: "He closes his eyes and leans into your touch, completely trusting and vulnerable." },
                    { character: this.gameState.playerName, text: "Your hair is so soft... and your smile when I touch you like this... it takes my breath away. Your music taste, your passion... everything about you is perfect.", portrait: 'player' },
                    { character: 'narrator', text: "In this intimate moment, you both understand that something profound has bloomed between you." },
                    { character: this.gameState.guyName, text: "Your eyes in the moonlight... they're like stars themselves. Your voice, your touch, your beautiful heart... you're everything I never knew I was searching for.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                soul_connection_final: [
                    { character: 'narrator', text: "You stand close together in comfortable, meaningful silence, communicating with your eyes and gentle smiles." },
                    { character: this.gameState.guyName, text: "Your presence, your understanding eyes... they speak to my soul without needing words. Your voice when you do speak... it's like poetry.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair moves gently in the night breeze as you share this profound moment of connection." },
                    { character: this.gameState.playerName, text: "And your peaceful energy, that beautiful hair catching starlight, your gentle smile... they give me such peace. Your musical soul resonates with mine.", portrait: 'player' },
                    { character: 'narrator', text: "The silence between you is filled with understanding and deep affection." },
                    { character: this.gameState.guyName, text: "Your eyes tell me everything I need to know. Your spirit, your joy, your beautiful essence... I'm completely captivated.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                whispered_confession: [
                    { character: 'narrator', text: "You lean close and whisper your feelings under the star-filled sky." },
                    { character: this.gameState.playerName, text: "Your gentle soul found mine in this garden... your hair, your smile, your incredible music taste... I think I'm falling for you.", portrait: 'player' },
                    { character: 'narrator', text: "His breath catches at your whispered confession." },
                    { character: this.gameState.guyName, text: "Your voice like a whisper in the night... it's the most beautiful sound in the world. Your eyes when you're vulnerable... they touch my heart. I'm falling for you too.", portrait: 'guy' },
                    { character: 'narrator', text: "Your whispered words create an intimate bubble around you both under the stars." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                grateful_heart: [
                    { character: 'narrator', text: "Your heart overflows with gratitude for this unexpected gift of love." },
                    { character: this.gameState.playerName, text: "I'm so grateful I stayed... your smile, your perfect messy hair, your amazing taste in music... you've given me something magical.", portrait: 'player' },
                    { character: 'narrator', text: "His eyes shine with emotion as he processes your gratitude." },
                    { character: this.gameState.guyName, text: "And I'm grateful you saw something in me worth staying for. Your voice when you speak from your heart, your eyes when you look at me... they make me feel like the luckiest person alive.", portrait: 'guy' },
                    { character: 'narrator', text: "The gratitude you share transforms into something deeper - a recognition of fate bringing you together." },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                caring_embrace: [
                    { character: 'narrator', text: "Unable to hold back any longer, you step closer and gently embrace him under the stars." },
                    { character: this.gameState.guyName, text: "Your arms around me... your voice close to my ear... this feels like coming home. Your eyes when you hold me... they're so full of care.", portrait: 'guy' },
                    { character: 'narrator', text: "His hair tickles your cheek as you hold each other close." },
                    { character: this.gameState.playerName, text: "Your warmth, your gentle heartbeat, that soft hair against my cheek... this is where I want to be. Your music, your soul... they complete something in me.", portrait: 'player' },
                    { character: 'narrator', text: "In this tender embrace, you both feel the promise of something beautiful beginning." },
                    { character: this.gameState.guyName, text: "Your touch, your voice, your beautiful spirit... you've awakened something in my heart I never knew existed. Your joy, your laughter... they're the light in my world.", portrait: 'guy' },
                    { character: '', text: "", nextBranch: 'end_scene' }
                ],

                // End of scene marker
                end_scene: [
                    { character: '', text: "", nextScene: true }
                ]
            }
        },

        // Epilogue - Happy Ending
        {
            background: 'garden',
            music: 'peaceful',
            branches: {
                main: [
                    { character: 'narrator', text: "Three months later, you return to the garden where it all began." },
                    { character: 'narrator', text: "Mahmood is humming that same folk song, his hair catching the morning light as he tends to the roses." },
                    { character: this.gameState.playerName, text: "Still serenading the flowers, I see. Your voice sounds even more beautiful now.", portrait: 'player' },
                    { character: 'narrator', text: "He turns with that radiant smile you've come to love so much." },
                    { character: this.gameState.guyName, text: "They grow better when they hear about you. Your eyes in this morning light... they outshine every flower here.", portrait: 'guy' },
                    { character: 'narrator', text: "You watch him work, his hair falling perfectly across his forehead as he concentrates." },
                    { character: this.gameState.playerName, text: "Your hair looks especially perfect when you're focused like that. Have I mentioned how much I love your taste in music?", portrait: 'player' },
                    { character: 'narrator', text: "He laughs, that wonderful sound that first captured your heart." },
                    { character: this.gameState.guyName, text: "Your voice when you tease me... it still makes my heart skip. Your smile, your joy, your beautiful spirit... I fall for you more each day.", portrait: 'guy' },
                    { character: 'narrator', text: "As you walk together through the garden where your love story began, you both know this is just the beginning of your beautiful journey together." },
                    { character: 'narrator', text: "The End" }
                ]
            }
        }
    ];
}
    startGame() {
        this.titleScreen?.classList.add('hidden');
        this.currentScene = 0;
        this.currentDialogue = 0;
        this.isWaitingForChoice = false;
        this.gameEnded = false; // Reset game ended flag for new game
        
        // Ensure menu container is visible during gameplay
        if (this.menuContainer) {
            this.menuContainer.style.display = 'flex';
            this.menuContainer.classList.remove('hidden');
        }
        
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
                
                // Ensure menu container is visible during gameplay
                if (this.menuContainer) {
                    this.menuContainer.style.display = 'flex';
                    this.menuContainer.classList.remove('hidden');
                }
                
                this.showScene();
            } else {
                this.startGame();
            }
        } catch (error) {
            console.error('Error loading game:', error);
            this.startGame();
        }
    }

    // Skip dialogue method for testing
    skipDialogue() {
        if (this.isProcessing || this.gameEnded) return;
        
        // If waiting for choice, don't skip
        if (this.isWaitingForChoice) {
            console.log('Cannot skip during choice selection');
            return;
        }
        
        // Skip current dialogue within the scene
        console.log('Skipping dialogue - advancing to next dialogue');
        this.nextDialogue();
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
    if (this.gameEnded) {
        return;
    }
    
    if (this.currentScene >= this.story.length) {
        this.showEnding();
        return;
    }
    
    const scene = this.story[this.currentScene];
    if (!scene?.branches) {
        this.nextScene();
        return;
    }

    // Get the current branch dialogues with improved fallback logic
    let currentBranchDialogues = scene.branches[this.currentBranch];
    
    // If current branch doesn't exist in this scene, try fallback
    if (!currentBranchDialogues) {
        console.log(`Branch ${this.currentBranch} not found in scene ${this.currentScene}, trying fallback`);
        
        // Try main branch first
        if (scene.branches.main) {
            console.log(`Falling back to main branch from ${this.currentBranch}`);
            this.currentBranch = 'main';
            currentBranchDialogues = scene.branches.main;
        } else {
            // Use first available branch
            const availableBranches = Object.keys(scene.branches);
            if (availableBranches.length > 0) {
                this.currentBranch = availableBranches[0];
                currentBranchDialogues = scene.branches[this.currentBranch];
                console.log(`No main branch, using first available: ${this.currentBranch}`);
            }
        }
    }
    
    // If we've reached the end of the current branch dialogue
    if (!currentBranchDialogues || this.currentDialogue >= currentBranchDialogues.length) {
        console.log(`End of branch ${this.currentBranch} in scene ${this.currentScene}`);
        
        // Special handling for ending branch - always show ending
        if (this.currentBranch === 'ending') {
            console.log('Ending branch completed, showing ending');
            this.showEnding();
            return;
        }
        
        // Check if this is the last scene
        if (this.currentScene >= this.story.length - 1) {
            console.log('End of story reached, showing ending');
            this.showEnding();
        } else {
            console.log('Progressing to next scene');
            this.nextScene();
        }
        return;
    }
    
    const dialogue = currentBranchDialogues[this.currentDialogue];
    if (!dialogue) {
        this.nextScene();
        return;
    }

	// Conditional gating for sub-branch impact
	if (dialogue.minRelationship !== undefined && this.gameState.relationship < dialogue.minRelationship) {
		this.currentDialogue++;
		this.showDialogue();
		return;
	}
	if (typeof dialogue.condition === 'function') {
		try {
			const ok = dialogue.condition({
				state: this.gameState,
				branch: this.currentBranch,
				route: this.routeBranch,
				choiceHistory: this.gameState.choiceHistory
			});
			if (!ok) {
				this.currentDialogue++;
				this.showDialogue();
				return;
			}
		} catch (err) {
			console.warn('Condition check failed:', err);
		}
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

	// If this dialogue is an automatic flow marker (no text), handle transitions now
	const isMarkerEntry = !dialogue.text || (typeof dialogue.text === 'string' && dialogue.text.trim() === '');
	if (isMarkerEntry) {
		if (dialogue.nextBranch) {
			// Avoid infinite loop if pointing to same branch
			if (dialogue.nextBranch !== this.currentBranch) {
				this.currentBranch = dialogue.nextBranch;
				this.currentDialogue = 0;
			} else {
				this.currentDialogue++;
			}
			this.isProcessing = true;
			setTimeout(() => {
				this.isProcessing = false;
				this.showDialogue();
			}, 50);
			return;
		}
		if (dialogue.nextScene) {
			this.isProcessing = true;
			setTimeout(() => {
				this.isProcessing = false;
				this.nextScene();
			}, 150);
			return;
		}
	}

	this.typewriterEffect(dialogue.text);

	// Add romantic effects based on dialogue content
	this.triggerRomanticEffects(dialogue);

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
        }, dialogue.text.length * 30 + 500);
    } else {
        this.isWaitingForChoice = false;
        if (this.continueIndicator) {
            this.continueIndicator.style.display = 'block';
        }
    }
    }

    showChoices(choices) {;
        const choiceButtons = document.querySelectorAll('.choice-btn');
        if (!choiceButtons.length) {
            console.error('Choice buttons not found');
            return;
        }
        
	// Setup choice buttons with clean, single-use handlers to avoid duplicates
	choices.forEach((choice, index) => {
		const btn = choiceButtons[index];
		if (btn) {
			// Replace node to remove any previously attached listeners
			const freshBtn = btn.cloneNode(true);
			btn.parentNode.replaceChild(freshBtn, btn);
			
			freshBtn.textContent = choice.text;
			freshBtn.style.display = 'block';
			
			// Use pointer events to unify mouse/touch and ensure single fire
			freshBtn.addEventListener('pointerup', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.selectChoice(choice);
			}, { once: true });
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

    // Modified selectChoice method to handle branch switching
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
        if (choice.effect.relationship !== undefined) {
            this.gameState.relationship += choice.effect.relationship;
        }
        if (choice.effect.scene) {
            this.gameState.flags.nextScene = choice.effect.scene;
        }
        if (choice.effect.gesture) {
            this.gameState.flags.gesture = choice.effect.gesture;
        }
		if (choice.effect.tag) {
			this.gameState.flags[choice.effect.tag] = true;
		}
		if (choice.effect.setFlag) {
			Object.keys(choice.effect.setFlag).forEach(k => {
				this.gameState.flags[k] = choice.effect.setFlag[k];
			});
		}
    }

    // Record choice in history for later reference
    this.gameState.choiceHistory.push({
        scene: this.currentScene,
        dialogue: this.currentDialogue,
        choice: choice.text,
        branch: this.currentBranch,
        newBranch: choice.nextBranch
    });

    console.log(`Choice made: "${choice.text}" - switching from ${this.currentBranch} to ${choice.nextBranch || 'same'}`);
    console.log(`Relationship level: ${this.gameState.relationship}`);

	// Switch branch if specified
	if (choice.nextBranch) {
		const scene = this.story[this.currentScene];
		const targetExists = !!scene?.branches?.[choice.nextBranch];
		if (!targetExists) {
			console.warn(`Target branch '${choice.nextBranch}' not found in scene ${this.currentScene}. Falling back to 'main'.`);
			this.currentBranch = scene?.branches?.main ? 'main' : (Object.keys(scene?.branches || {})[0] || 'main');
		} else {
			this.currentBranch = choice.nextBranch;
		}
		// Persist narrative route only if next scene supports this branch
		if (this.currentBranch && this.currentBranch !== 'end_scene') {
			const nextScene = this.story[this.currentScene + 1];
			if (nextScene?.branches?.[this.currentBranch]) {
				this.routeBranch = this.currentBranch;
				console.log(`Route locked to '${this.routeBranch}' for next scene`);
			} else {
				console.log(`Next scene lacks branch '${this.currentBranch}', keeping route '${this.routeBranch}'`);
			}
		}
		console.log(`Switched to branch: ${this.currentBranch}`);
		// Reset dialogue to start from beginning of new branch
		this.currentDialogue = 0;
	} else {
        // Only increment dialogue if staying in same branch
        this.currentDialogue++;
    }
    
    // Small delay to prevent immediate re-triggering
    setTimeout(() => {
        this.isProcessing = false;
        this.showDialogue();
    }, 200);
    }

    // Modified nextScene method with robust branch maintenance
    nextScene() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.currentScene++;
        this.currentDialogue = 0;
        this.isWaitingForChoice = false;
        
        // Clear end_scene marker before deciding next branch
        if (this.currentBranch === 'end_scene') {
            this.currentBranch = this.routeBranch || this.currentBranch;
        }
        
        // Decide next scene branch using route and flags (evaluates currentScene)
        this.shouldMaintainBranch();
        
        setTimeout(() => {
            this.isProcessing = false;
            if (this.currentScene < this.story.length) {
                this.showScene();
            } else {
                this.showEnding();
            }
        }, 200);
    }

    // Helper method to determine if branch should be maintained across scenes
	shouldMaintainBranch() {
        // Prefer persisted routeBranch; avoid carrying 'end_scene'
        const desiredBranch = (this.routeBranch && this.routeBranch !== 'end_scene') ? this.routeBranch : null;
        if (this.currentScene < this.story.length) {
            const nextScene = this.story[this.currentScene];
            if (desiredBranch && nextScene?.branches?.[desiredBranch]) {
				console.log(`Maintaining route: ${desiredBranch} for next scene`);
				this.currentBranch = desiredBranch;
				return true;
			}

            // Map resolution branches from previous scene to current scene
            const aliasMap = {
                4: {
                    passionate_reassurance: 'starlight_dance',
                    love_confession: 'love_declaration',
                    tender_touch: 'moonlit_intimacy',
                    peace_found: 'soul_connection_final',
                    home_feeling: 'love_declaration',
                    fear_explanation: 'grateful_heart',
                    worth_staying: 'caring_embrace'
                }
            };
            const prevIndex = this.currentScene - 1;
            const mapped = desiredBranch && aliasMap[prevIndex]?.[desiredBranch];
			if (mapped && nextScene?.branches?.[mapped]) {
				console.log(`Mapped route '${desiredBranch}' to '${mapped}' for next scene`);
				this.currentBranch = mapped;
				return true;
			}

			// Prefer a non-main branch if available to avoid repetitive main flow
			if (nextScene?.branches) {
				const keys = Object.keys(nextScene.branches);
				const nonMain = keys.find(k => k !== 'main');
				if (nonMain) {
					console.log(`Choosing non-main branch '${nonMain}' for next scene`);
					this.currentBranch = nonMain;
					return true;
				}
				if (nextScene.branches.main) {
                    console.log(`Only main available; using main for next scene`);
					this.currentBranch = 'main';
					return true;
				}
			}
			const available = Object.keys(nextScene?.branches || {});
			if (available.length) {
				this.currentBranch = available[0];
				console.log(`Using first available branch '${this.currentBranch}' for next scene`);
				return true;
			}
		}
		console.log(`No next scene branches; keeping current branch: ${this.currentBranch}`);
		return true;
	}

    // Add method to get current branch for debugging
    getCurrentBranch() {
        return this.currentBranch;
    }

    // Add method to get choice history for debugging
    getChoiceHistory() {
        return this.gameState.choiceHistory;
    }

    // Debug method to show current game state
    debugGameState() {
        console.log('=== GAME STATE DEBUG ===');
        console.log(`Current Scene: ${this.currentScene}`);
        console.log(`Current Dialogue: ${this.currentDialogue}`);
        console.log(`Current Branch: ${this.currentBranch}`);
        console.log(`Relationship: ${this.gameState.relationship}`);
        console.log(`Game Ended: ${this.gameEnded}`);
        
        if (this.currentScene < this.story.length) {
            const scene = this.story[this.currentScene];
            if (scene?.branches) {
                console.log(`Available branches in current scene:`, Object.keys(scene.branches));
                const currentBranchDialogues = scene.branches[this.currentBranch];
                if (currentBranchDialogues) {
                    console.log(`Dialogues in current branch: ${currentBranchDialogues.length}`);
                } else {
                    console.log(`Current branch "${this.currentBranch}" not found in scene!`);
                }
            }
        }
        
        console.log('Choice History:', this.gameState.choiceHistory);
        console.log('========================');
    }

    nextDialogue() {
    if (this.isProcessing || this.isWaitingForChoice || this.gameEnded) return;
    
    this.isProcessing = true;
    
    // Skip typewriter if it's running
    if (this.currentTypewriterInterval) {
        clearInterval(this.currentTypewriterInterval);
        this.currentTypewriterInterval = null;
        const scene = this.story[this.currentScene];
        const currentBranchDialogues = scene?.branches[this.currentBranch];
        const dialogue = currentBranchDialogues?.[this.currentDialogue];
        if (dialogue && this.dialogueText) {
            this.dialogueText.textContent = dialogue.text;
        }
        this.isProcessing = false;
        return;
    }
    
    // Check if we're at the end of the current branch before incrementing
    const scene = this.story[this.currentScene];
    const currentBranchDialogues = scene?.branches[this.currentBranch];
    
    if (!currentBranchDialogues || this.currentDialogue >= currentBranchDialogues.length - 1) {
        // We're at the end of this branch
        console.log(`End of branch ${this.currentBranch} reached`);
        this.isProcessing = false;
        
        // Check if this is the last scene
        if (this.currentScene >= this.story.length - 1) {
            console.log('End of story reached, showing ending');
            this.showEnding();
        } else {
            console.log('Progressing to next scene');
            this.nextScene();
        }
        return;
    }
    
    this.currentDialogue++;
    
    setTimeout(() => {
        this.isProcessing = false;
        this.showDialogue();
    }, 100);
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
        // Set game ended flag to prevent further dialogue
        this.gameEnded = true;
        
        // Clear any active typewriter intervals
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
        }
        
        // Clear any event handlers that might interfere
        if (this.dialogueBox) {
            this.dialogueBox.onclick = null;
        }
        document.onkeydown = null;
        
        // Hide choice container to ensure canAdvanceDialogue works
        if (this.choiceContainer) {
            this.choiceContainer.style.display = 'none';
            this.choiceContainer.classList.add('hidden');
        }
        
        // Determine ending based on relationship level
        const relationshipLevel = this.gameState.relationship;
        let endingType = 'low'; // Default to low ending
        
        if (relationshipLevel >= 6) {
            endingType = 'high'; // Happy ending
        } else if (relationshipLevel >= 2) {
            endingType = 'medium'; // Continue seeing each other
        }
        
        // Build ending context from route and flags for personalization
        const endingContext = {
            route: this.routeBranch,
            flags: { ...this.gameState.flags },
            relationship: relationshipLevel
        };
        
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

        // Show ending based on relationship level with personalized context
        this.showEndingSequence(endingType, endingContext);
    }

    showEndingSequence(endingType, endingContext) {
        // Ensure dialogue box is visible for ending sequence
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'block';
            this.dialogueBox.classList.remove('hidden');
            this.dialogueBox.onclick = null;
        }
        
        // Clear any existing event handlers to prevent conflicts
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
            console.log(`showNextDialogue called: currentDialogue=${currentDialogue}, total=${endingDialogues.length}, endingType=${endingType}`);
            if (currentDialogue < endingDialogues.length) {
                const dialogue = endingDialogues[currentDialogue];
                console.log(`Showing dialogue ${currentDialogue}:`, dialogue);
                
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
                    console.log(`waitForContinue: canAdvance=${this.canAdvanceDialogue()}, isProcessing=${this.isProcessing}, isWaitingForChoice=${this.isWaitingForChoice}, currentTypewriterInterval=${!!this.currentTypewriterInterval}`);
                    if (this.canAdvanceDialogue()) {
                        const continueHandler = () => {
                            console.log(`continueHandler called for dialogue ${currentDialogue-1}`);
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
                console.log(`All dialogues finished for ${endingType} ending, showing letter`);
                // Clear all handlers before showing letter
                if (this.dialogueBox) {
                    this.dialogueBox.onclick = null;
                }
                document.onkeydown = null;
                
                // Show the ending letter before restart option
                setTimeout(() => {
                    console.log(`Calling showEndingLetter for ${endingType}`);
                    this.showEndingLetter(endingType, endingContext);
                }, 1000);
            }
        };

        showNextDialogue();
    }

    showRestartOption() {
        // Clear any existing event handlers to prevent conflicts
        if (this.dialogueBox) {
            this.dialogueBox.onclick = null;
        }
        document.onkeydown = null;
        
        // Ensure letter display is hidden before showing restart option
        const letterDisplay = document.getElementById('letter-display');
        if (letterDisplay) {
            letterDisplay.classList.remove('visible');
            letterDisplay.classList.add('hidden');
        }
        
        // Show dialogue box again for the restart message
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'block';
        }
        
        // Set the restart message directly without typewriter effect to avoid handler conflicts
        if (this.dialogueText) {
            this.dialogueText.textContent = "✨ Thank you for playing! Would you like to start a new story?";
        }
        
        // Hide continue indicator since we're showing choices
        if (this.continueIndicator) {
            this.continueIndicator.style.display = 'none';
        }

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


    typewriterEffect(text) {
        if (!this.dialogueText) {
            console.error('Dialogue text element not found');
            return;
        }
        
        // Clear any existing typewriter interval
        if (this.currentTypewriterInterval) {
            clearInterval(this.currentTypewriterInterval);
            this.currentTypewriterInterval = null;
        }
        
        this.dialogueText.textContent = '';
        let i = 0;
        const speed = 25;
        
        this.currentTypewriterInterval = setInterval(() => {
            if (i < text.length) {
                this.dialogueText.textContent += text.charAt(i++);
            } else {
                clearInterval(this.currentTypewriterInterval);
                this.currentTypewriterInterval = null;
            }
        }, speed);
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

    showEndingLetter(endingType, endingContext = { route: this.routeBranch, flags: this.gameState.flags, relationship: this.gameState.relationship }) {
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
		// Personalize letter title for certain routes
        let personalizedTitle = letter.title;
		if (endingType === 'high') {
			if (endingContext.route === 'love_declaration' || endingContext.flags.love_confession) {
				personalizedTitle = 'A Love Letter Under the Stars';
			} else if (endingContext.route === 'starlight_dance' || endingContext.flags.dance) {
				personalizedTitle = 'A Letter After Our Starlight Dance';
			} else if (endingContext.flags.quiet_intimacy || endingContext.route === 'soul_connection_final') {
				personalizedTitle = 'A Letter from Our Quiet Hearts';
			} else if (endingContext.route === 'moonlit_intimacy' || endingContext.flags.hair_touch) {
				personalizedTitle = 'A Letter from the Moonlight';
			} else if (endingContext.route === 'grateful_heart' || endingContext.flags.gratitude) {
				personalizedTitle = 'A Letter of Gratitude';
			} else if (endingContext.route === 'caring_embrace' || endingContext.flags.deep_care) {
				personalizedTitle = 'A Letter from Your Arms';
			} else if (endingContext.route === 'whispered_confession' || endingContext.flags.whispered_love) {
				personalizedTitle = 'A Letter in Whispers';
			}
		} else if (endingType === 'medium') {
			if (endingContext.route === 'starlight_dance' || endingContext.flags.dance) {
				personalizedTitle = 'A Gentle Letter After Our Dance';
			} else if (endingContext.flags.quiet_intimacy || endingContext.route === 'soul_connection_final') {
				personalizedTitle = 'A Gentle Letter from Quiet Hearts';
			} else if (endingContext.route === 'moonlit_intimacy' || endingContext.flags.hair_touch) {
				personalizedTitle = 'A Gentle Letter from the Moonlight';
			}
        }
        letterTitle.textContent = personalizedTitle;
        letterText.textContent = '';

        // Show letter display
        letterDisplay.classList.remove('hidden');
        letterDisplay.classList.add('visible');

        // Hide dialogue box and characters
        if (this.dialogueBox) {
            this.dialogueBox.style.display = 'none';
        }
        this.showCharacter(null); // Hide characters

        // Set up close functionality immediately (don't wait for typewriter to finish)
        const closeHandler = () => {
            letterDisplay.classList.remove('visible');
            letterDisplay.classList.add('hidden');
            
            // Clear all event handlers
            if (closeButton) {
                closeButton.onclick = null;
            }
            letterDisplay.onclick = null;
            document.onkeydown = null;
            
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

        // Start typewriter effect for letter content
        // Personalize body intro based on route/flags
        let personalizedIntro = '';
		if (endingType === 'high') {
            if (endingContext.route === 'love_declaration' || endingContext.flags.love_confession) {
                personalizedIntro = `Last night, under the stars where we shared our truth, I realized how completely my heart belongs to you.\n\n`;
            } else if (endingContext.route === 'starlight_dance' || endingContext.flags.dance) {
                personalizedIntro = `I can still feel the rhythm of our steps beneath the starlight, like the garden itself was dancing with us.\n\n`;
            } else if (endingContext.flags.quiet_intimacy || endingContext.route === 'soul_connection_final') {
                personalizedIntro = `That quiet moment we shared—without words, yet full of meaning—will stay with me forever.\n\n`;
			} else if (endingContext.route === 'moonlit_intimacy' || endingContext.flags.hair_touch) {
				personalizedIntro = `Your touch in the moonlight is still warming my skin, as if the night itself held us in its gentle hands.\n\n`;
			} else if (endingContext.route === 'grateful_heart' || endingContext.flags.gratitude) {
				personalizedIntro = `Gratitude is overflowing in me today—for your kindness, your patience, and the way you saw me.\n\n`;
			} else if (endingContext.route === 'caring_embrace' || endingContext.flags.deep_care) {
				personalizedIntro = `When you held me, I knew what home felt like. That embrace is where I want to live.\n\n`;
			} else if (endingContext.route === 'whispered_confession' || endingContext.flags.whispered_love) {
				personalizedIntro = `Your whispered words still echo like a secret only the stars could hear.\n\n`;
            }
		} else if (endingType === 'medium') {
			if (endingContext.route === 'starlight_dance' || endingContext.flags.dance) {
				personalizedIntro = `I keep thinking of our small dance among the tables and trees—so simple, and so perfect.\n\n`;
			} else if (endingContext.flags.quiet_intimacy || endingContext.route === 'soul_connection_final') {
				personalizedIntro = `The way we understood each other without needing many words—that’s what I’ll treasure.\n\n`;
			} else if (endingContext.route === 'moonlit_intimacy' || endingContext.flags.hair_touch) {
				personalizedIntro = `The gentle way you brushed my hair stays with me, like a promise of more quiet moments.\n\n`;
			}
		}

        // Route-specific closing paragraph to fully customize each letter
        let routeSuffix = '';
        const route = endingContext.route;
        if (route === 'love_declaration' || endingContext.flags.love_confession) {
            routeSuffix = `\n\nSince that confession, every sunrise feels like it carries your name. If you ever doubt it, look to the flowers—they all lean toward you.`;
        } else if (route === 'starlight_dance' || endingContext.flags.dance) {
            routeSuffix = `\n\nWhen the night is quiet, I hum our melody and remember how your hands felt in mine. Let’s never stop dancing, even if only in our hearts.`;
        } else if (route === 'soul_connection_final' || endingContext.flags.quiet_intimacy) {
            routeSuffix = `\n\nThank you for the kind of silence that speaks. With you, even the wind in the leaves sounds like poetry.`;
        } else if (route === 'moonlit_intimacy' || endingContext.flags.hair_touch) {
            routeSuffix = `\n\nI still feel the gentleness of your touch. If the moon could write, I think it would sign its light over to you.`;
        } else if (route === 'grateful_heart' || endingContext.flags.gratitude) {
            routeSuffix = `\n\nI’m grateful for the way you saw me when I struggled to see myself. May our days be full of little thank-yous and quiet joy.`;
        } else if (route === 'caring_embrace' || endingContext.flags.deep_care) {
            routeSuffix = `\n\nYour arms are the answer I didn’t know I was seeking. Wherever we go, I want that to be my true north.`;
        } else if (route === 'whispered_confession' || endingContext.flags.whispered_love) {
            routeSuffix = `\n\nI carry your whispers with me. They’re a promise the stars heard first—and I intend to keep.`;
        } else if (route === 'music_lover') {
            routeSuffix = `\n\nThere’s a song I only hear when you’re near. Perhaps one day we’ll write it together.`;
        } else if (route === 'curious') {
            routeSuffix = `\n\nYour questions opened doors I hadn’t noticed. Please—keep asking. I want to find the answers by your side.`;
        } else if (route === 'different_styles') {
            routeSuffix = `\n\nWe are different in the most harmonious way. I think that’s why we fit.`;
        } else if (route === 'adventure') {
            routeSuffix = `\n\nThere are so many paths we haven’t walked yet. Take my hand—we’ll find them all.`;
        }

        const finalLetterText = personalizedIntro + letter.text + routeSuffix;

        this.typewriterInLetter('letter-text', finalLetterText, () => {
            // Letter typing is complete - no additional action needed
            console.log('Letter typing completed');
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
        const modal = document.getElementById('settings-modal');
        
        if (!modal) {
            console.error('Settings modal not found!');
            return;
        }
        
        const musicStatus = this.isMusicEnabled ? 'ON' : 'OFF';
        const volumePercent = Math.round(this.musicVolume * 100);
        
        // Update the music status display
        const musicStatusEl = document.getElementById('music-status');
        const volumeLevelEl = document.getElementById('volume-level');
        
        if (musicStatusEl) musicStatusEl.textContent = musicStatus;
        if (volumeLevelEl) volumeLevelEl.textContent = `${volumePercent}%`;
        
        modal.classList.remove('hidden');
    }

    closeSettings() {
        const modal = document.getElementById('settings-modal');
        modal.classList.add('hidden');
    }

    increaseVolume() {
        if (this.musicVolume < 1) {
            this.setMusicVolume(Math.min(1, this.musicVolume + 0.1));
            this.saveAudioSettings();
            
            // Update the display if settings modal is open
            const modal = document.getElementById('settings-modal');
            if (!modal.classList.contains('hidden')) {
                document.getElementById('volume-level').textContent = `${Math.round(this.musicVolume * 100)}%`;
            }
        }
    }

    decreaseVolume() {
        if (this.musicVolume > 0) {
            this.setMusicVolume(Math.max(0, this.musicVolume - 0.1));
            this.saveAudioSettings();
            
            // Update the display if settings modal is open
            const modal = document.getElementById('settings-modal');
            if (!modal.classList.contains('hidden')) {
                document.getElementById('volume-level').textContent = `${Math.round(this.musicVolume * 100)}%`;
            }
        }
    }

    skipToEnding(endingType) {
        // Close settings modal
        this.closeSettings();
        
        // Clear any existing game state
        this.currentDialogueIndex = 0;
        this.currentScene = 'ending';
        
        // Show dialogue box for ending sequence
        const dialogueBox = document.getElementById('dialogue-box');
        if (dialogueBox) dialogueBox.style.display = 'block';
        
        const choiceContainer = document.getElementById('choice-container');
        if (choiceContainer) choiceContainer.style.display = 'none';
        
        const characterLeft = document.getElementById('character-left');
        if (characterLeft) characterLeft.style.display = 'none';
        
        const characterRight = document.getElementById('character-right');
        if (characterRight) characterRight.style.display = 'none';
        
        // Set the relationship level based on ending type
        switch(endingType) {
            case 'low':
                this.gameState.relationship = 1; // Low relationship
                break;
            case 'medium':
                this.gameState.relationship = 4; // Medium relationship
                break;
            case 'high':
                this.gameState.relationship = 8; // High relationship
                break;
        }
        
        console.log(`Skipping to ${endingType} ending with relationship level: ${this.gameState.relationship}`);
        
        // Start the ending sequence
        this.showEnding();
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
        this.saveAudioSettings();
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
        this.saveAudioSettings();
        
        // Update the display if settings modal is open
        const modal = document.getElementById('settings-modal');
        if (modal && !modal.classList.contains('hidden')) {
            document.getElementById('music-status').textContent = this.isMusicEnabled ? 'ON' : 'OFF';
        }
        
        return this.isMusicEnabled;
    }

    // Save audio settings to localStorage
    saveAudioSettings() {
        const audioSettings = {
            musicVolume: this.musicVolume,
            isMusicEnabled: this.isMusicEnabled
        };
        localStorage.setItem('flowerNovelAudioSettings', JSON.stringify(audioSettings));
    }

    // Load audio settings from localStorage
    loadAudioSettings() {
        try {
            const savedSettings = localStorage.getItem('flowerNovelAudioSettings');
            if (savedSettings) {
                const audioSettings = JSON.parse(savedSettings);
                this.musicVolume = audioSettings.musicVolume || 0.3;
                this.isMusicEnabled = audioSettings.isMusicEnabled !== undefined ? audioSettings.isMusicEnabled : true;
            }
        } catch (error) {
            console.log('Could not load audio settings:', error);
            // Use default values
            this.musicVolume = 0.3;
            this.isMusicEnabled = true;
        }
    }
}

// Initialize game with singleton pattern
let visualNovelInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!visualNovelInstance) {
        visualNovelInstance = new VisualNovel();
    }
});