export class CutsceneManager {
    constructor(game) {
        this.game = game;
        this.isPlaying = false;
        this.canSkip = true;
        this.skipDelay = 3000; // Allow skip after 3 seconds
        this.loadTimeout = 10000; // 10 second timeout for loading
    }

    async playCutscene(cutsceneId, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.isPlaying = true;
                
                // Don't remove loading screen here - let video control it
                
                // Set up timeout to prevent hanging
                const timeoutId = setTimeout(() => {
                    console.warn(`Cutscene ${cutsceneId} timed out, continuing to game`);
                    this.endCutscene(modal, resolve);
                }, this.loadTimeout);
                
                // Create cutscene modal
                const modal = this.createCutsceneModal(cutsceneId, options);
                document.body.appendChild(modal);
                
                // Get video element
                const video = modal.querySelector('.cutscene-video');
                const skipBtn = modal.querySelector('.cutscene-skip');
                const skipTimer = modal.querySelector('.skip-timer');
                const loadingOverlay = modal.querySelector('.loading-overlay');
                
                // Clear timeout when video loads successfully
                video.addEventListener('loadeddata', () => {
                    console.log('Cutscene video loaded');
                    clearTimeout(timeoutId);
                    if (loadingOverlay) loadingOverlay.classList.add('hidden');
                    this.startProgressTracking(modal, video);
                    
                    // Now remove the external loading screen if it exists
                    const externalLoadingScreen = document.getElementById('cutscene-loading');
                    if (externalLoadingScreen) {
                        externalLoadingScreen.remove();
                    }
                });
                
                video.addEventListener('canplay', () => {
                    console.log('Cutscene video can play');
                    clearTimeout(timeoutId);
                    if (loadingOverlay) loadingOverlay.classList.add('hidden');
                    
                    // Remove external loading screen when video is ready to play
                    const externalLoadingScreen = document.getElementById('cutscene-loading');
                    if (externalLoadingScreen) {
                        externalLoadingScreen.remove();
                    }
                });
                
                video.addEventListener('ended', () => {
                    console.log('Cutscene ended naturally');
                    clearTimeout(timeoutId);
                    this.endCutscene(modal, resolve);
                });
                
                video.addEventListener('error', (e) => {
                    console.error('Cutscene video error:', e);
                    clearTimeout(timeoutId);
                    // Show error message and continue
                    this.showVideoError(modal);
                    setTimeout(() => {
                        this.endCutscene(modal, resolve);
                    }, 2000);
                });
                
                // Setup skip functionality
                let canSkipNow = !options.forceWatch;
                if (options.forceWatch || this.skipDelay > 0) {
                    skipBtn.disabled = true;
                    skipBtn.textContent = 'Please wait...';
                    
                    const enableSkip = () => {
                        canSkipNow = true;
                        skipBtn.disabled = false;
                        skipBtn.textContent = 'Skip Cutscene';
                        if (skipTimer) skipTimer.remove();
                    };
                    
                    setTimeout(enableSkip, this.skipDelay);
                    
                    // Also enable skip if video fails to load
                    video.addEventListener('error', enableSkip);
                    setTimeout(enableSkip, this.loadTimeout - 1000);
                }
                
                skipBtn.addEventListener('click', () => {
                    if (canSkipNow) {
                        console.log('Cutscene skipped by user');
                        clearTimeout(timeoutId);
                        this.endCutscene(modal, resolve);
                    }
                });
                
                // Escape key to skip
                const escapeHandler = (e) => {
                    if (e.key === 'Escape' && canSkipNow) {
                        clearTimeout(timeoutId);
                        this.endCutscene(modal, resolve);
                        document.removeEventListener('keydown', escapeHandler);
                    }
                };
                document.addEventListener('keydown', escapeHandler);
                
                // Start playing with better error handling
                const attemptPlay = () => {
                    // Make sure video is still in DOM before attempting to play
                    if (!video.parentNode) {
                        console.warn('Video element removed from DOM, cannot play');
                        this.endCutscene(modal, resolve);
                        return;
                    }
                    
                    video.play().catch(e => {
                        console.warn('Autoplay failed, showing play button:', e);
                        // Only show play button if video is still in DOM
                        if (video.parentNode) {
                            this.showPlayButton(modal, video);
                        }
                    });
                };
                
                // Try to play after a short delay to ensure DOM is stable
                setTimeout(attemptPlay, 100);
                
            } catch (error) {
                console.error('Failed to play cutscene:', error);
                this.isPlaying = false;
                reject(error);
            }
        });
    }

    showVideoError(modal) {
        const loadingOverlay = modal.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="text-center text-white">
                    <i class="bi bi-exclamation-triangle text-4xl mb-4 text-yellow-400"></i>
                    <p class="mb-2">Cutscene could not be loaded</p>
                    <p class="text-sm text-gray-400">Continuing to game...</p>
                </div>
            `;
        }
    }

    createCutsceneModal(cutsceneId, options) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black z-50 flex items-center justify-center';
        modal.id = 'cutscene-modal';
        
        const videoUrl = this.getCutsceneUrl(cutsceneId);
        const subtitle = options.subtitle || '';
        
        modal.innerHTML = `
            <div class="relative w-full h-full flex items-center justify-center">
                <!-- Video Container -->
                <div class="relative w-full h-full max-w-screen max-h-screen">
                    <video class="cutscene-video w-full h-full object-contain bg-black" 
                           preload="auto" 
                           ${options.loop ? 'loop' : ''}>
                        <source src="${videoUrl}" type="video/mp4">
                        <p class="text-white text-center">Your browser doesn't support video playback.</p>
                    </video>
                    
                    <!-- Play Button Overlay (for autoplay failures) -->
                    <div class="play-overlay hidden absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                        <button class="play-btn bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg text-xl font-bold transition-all transform hover:scale-105">
                            <i class="bi bi-play-fill mr-2"></i>Play Cutscene
                        </button>
                    </div>
                    
                    <!-- Loading Indicator -->
                    <div class="loading-overlay absolute inset-0 bg-black flex items-center justify-center">
                        <div class="text-center text-white">
                            <i class="bi bi-gear-fill animate-spin text-4xl mb-4"></i>
                            <p>Loading cutscene...</p>
                        </div>
                    </div>
                    
                    <!-- Subtitle -->
                    ${subtitle ? `
                        <div class="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
                            <p class="text-white text-lg bg-black bg-opacity-75 px-4 py-2 rounded">${subtitle}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Skip Button -->
                    <div class="absolute top-4 right-4 flex items-center space-x-2">
                        <span class="skip-timer text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                            Skip available in ${Math.ceil(this.skipDelay / 1000)}s
                        </span>
                        <button class="cutscene-skip bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Please wait...
                        </button>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                        <div class="cutscene-progress h-full bg-blue-500 transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    showPlayButton(modal, video) {
        const loadingOverlay = modal.querySelector('.loading-overlay');
        const playOverlay = modal.querySelector('.play-overlay');
        const playBtn = modal.querySelector('.play-btn');
        
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        if (playOverlay) playOverlay.classList.remove('hidden');
        
        playBtn.addEventListener('click', () => {
            video.play();
            playOverlay.classList.add('hidden');
            this.startProgressTracking(modal, video);
        });
    }

    startProgressTracking(modal, video) {
        const progressBar = modal.querySelector('.cutscene-progress');
        const loadingOverlay = modal.querySelector('.loading-overlay');
        
        // Hide loading overlay
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        
        // Update progress bar
        const updateProgress = () => {
            if (video.duration > 0) {
                const progress = (video.currentTime / video.duration) * 100;
                progressBar.style.width = `${progress}%`;
            }
        };
        
        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadeddata', updateProgress);
    }

    endCutscene(modal, resolve) {
        this.isPlaying = false;
        
        // Fade out effect
        modal.style.transition = 'opacity 0.5s ease-out';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            resolve();
        }, 500);
    }

    getCutsceneUrl(cutsceneId) {
        // Map cutscene IDs to video files
        const cutscenes = {
            'intro': '/static/videos/intro-cutscene.mp4',
            'room1-intro': '/static/videos/room1-intro.mp4',
            'room2-intro': '/static/videos/room2-intro.mp4',
            'room3-intro': '/static/videos/room3-intro.mp4',
            'room4-intro': '/static/videos/room4-intro.mp4',
            'room5-intro': '/static/videos/room5-intro.mp4',
            'ending': '/static/videos/ending-cutscene.mp4'
        };
        
        return cutscenes[cutsceneId] || cutscenes['intro']; // Default to intro video
    }

    async playIntroCutscene() {
        console.log('Playing intro cutscene...');
        try {
            // Don't remove loading screen here - let the cutscene manager handle it
            await this.playCutscene('intro', {
                forceWatch: false // Allow skip for testing
            });
            console.log('Intro cutscene completed');
        } catch (error) {
            console.error('Intro cutscene failed:', error);
            // Make sure to clean up any loading screens on error
            const loadingScreen = document.getElementById('cutscene-loading');
            if (loadingScreen) {
                loadingScreen.remove();
            }
            // If video fails, show animated fallback
            console.log('Falling back to animated intro...');
            await this.playAnimatedIntro();
        }
    }

    async playAnimatedIntro() {
        return new Promise((resolve) => {
            // Create animated intro modal
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black z-50 flex items-center justify-center';
            modal.id = 'animated-intro-modal';
            
            modal.innerHTML = `
                <div class="text-center text-white">
                    <div class="mb-8 intro-animation">
                        <div class="text-6xl mb-4 animate-pulse">🔬</div>
                        <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            AscendEd: Tech Lab Breakout
                        </h1>
                        <div class="text-xl mb-6 text-gray-300 typing-animation">
                            Welcome, Agent. Your mission begins now...
                        </div>
                    </div>
                    
                    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                        <button id="skip-intro" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">
                            Skip Intro
                        </button>
                    </div>
                    
                    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                        <div id="intro-progress" class="h-full bg-blue-500 transition-all duration-100" style="width: 0%"></div>
                    </div>
                </div>
                
                <style>
                    .typing-animation {
                        animation: typing 3s steps(40, end), blink-caret 0.75s step-end infinite;
                        white-space: nowrap;
                        overflow: hidden;
                        border-right: 3px solid #fff;
                    }
                    
                    @keyframes typing {
                        from { width: 0; }
                        to { width: 100%; }
                    }
                    
                    @keyframes blink-caret {
                        from, to { border-color: transparent; }
                        50% { border-color: #fff; }
                    }
                    
                    .intro-animation {
                        animation: fadeInUp 1s ease-out;
                    }
                    
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                </style>
            `;
            
            document.body.appendChild(modal);
            
            // Set up skip button
            const skipBtn = modal.querySelector('#skip-intro');
            const progressBar = modal.querySelector('#intro-progress');
            
            let progress = 0;
            const duration = 5000; // 5 seconds
            const interval = 50; // Update every 50ms
            const increment = (interval / duration) * 100;
            
            const progressInterval = setInterval(() => {
                progress += increment;
                progressBar.style.width = `${Math.min(progress, 100)}%`;
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    this.endAnimatedIntro(modal, resolve);
                }
            }, interval);
            
            skipBtn.addEventListener('click', () => {
                clearInterval(progressInterval);
                this.endAnimatedIntro(modal, resolve);
            });
            
            // Auto-end after duration
            setTimeout(() => {
                clearInterval(progressInterval);
                this.endAnimatedIntro(modal, resolve);
            }, duration);
        });
    }

    endAnimatedIntro(modal, resolve) {
        modal.style.transition = 'opacity 0.5s ease-out';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            resolve();
        }, 500);
    }
}

