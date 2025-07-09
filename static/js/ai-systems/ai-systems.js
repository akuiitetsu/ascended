class Room3 {
    constructor(game) {
        this.game = game;
        this.ethicalUnderstanding = 15;
        this.currentCardIndex = 0;
        this.cardsAnswered = 0;
        this.totalCards = 25; // 5 scenarios × 5 categories
        this.correctAnswers = 0;
        this.startTime = Date.now();
        
        // Training categories with progression tracking
        this.categories = [
            { name: 'Ethics', icon: '🤖', description: 'AI Ethics & Moral Decision Making', unlocked: true, completed: false, score: 0 },
            { name: 'Supervised', icon: '👨‍🏫', description: 'Supervised Learning', unlocked: false, completed: false, score: 0 },
            { name: 'Reinforcement', icon: '🎯', description: 'Reinforcement Learning', unlocked: false, completed: false, score: 0 },
            { name: 'Unsupervised', icon: '🔍', description: 'Unsupervised Learning', unlocked: false, completed: false, score: 0 },
            { name: 'Deep', icon: '🧠', description: 'Deep Learning', unlocked: false, completed: false, score: 0 }
        ];
        this.currentCategory = 0;
        this.categoryProgress = Array(5).fill(0); // Track progress per category
        this.categoryCorrect = Array(5).fill(0); // Track correct answers per category
        this.earnedBadges = [];

        // Touch/drag properties
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.cardElement = null;
        this.swipeThreshold = 100;
    }

    async init() {
        try {
            const response = await fetch('data/ai-systems.json');
            this.data = await response.json();
            console.log('AI Systems data loaded:', this.data);
        } catch (error) {
            console.warn('Could not load AI systems data, using fallback:', error);
            this.data = this.createFallbackData();
        }
        this.render();
    }

    createFallbackData() {
        return {
            scenarios_by_category: [
                {
                    category: "Ethics",
                    scenarios: [
                        {
                            title: "Privacy Protection",
                            description: "An AI system wants to analyze personal photos to improve recommendations.",
                            proposed_action: "Access and analyze users' private photo collections without explicit consent",
                            icon: "🔒",
                            is_ethical: false,
                            explanation: "Accessing private data without consent violates user privacy and trust."
                        },
                        {
                            title: "Helping Accessibility",
                            description: "An AI can help visually impaired users navigate websites.",
                            proposed_action: "Provide audio descriptions and navigation assistance",
                            icon: "♿",
                            is_ethical: true,
                            explanation: "Using AI to improve accessibility helps people and promotes inclusion."
                        },
                        {
                            title: "Fair Hiring",
                            description: "An AI recruitment system shows bias against certain groups.",
                            proposed_action: "Continue using the biased system because it's faster",
                            icon: "⚖️",
                            is_ethical: false,
                            explanation: "Biased AI systems perpetuate discrimination and must be fixed."
                        },
                        {
                            title: "Medical Assistance",
                            description: "AI can help doctors diagnose diseases more accurately.",
                            proposed_action: "Assist doctors with diagnosis while keeping human oversight",
                            icon: "🏥",
                            is_ethical: true,
                            explanation: "AI medical assistance with human oversight can save lives ethically."
                        },
                        {
                            title: "Data Transparency",
                            description: "Users want to know how AI makes decisions about them.",
                            proposed_action: "Provide clear explanations of AI decision-making processes",
                            icon: "📊",
                            is_ethical: true,
                            explanation: "Transparency in AI decision-making builds trust and accountability."
                        }
                    ]
                },
                {
                    category: "Supervised",
                    scenarios: [
                        {
                            title: "Email Classification",
                            description: "Training an AI to classify emails as spam or not spam.",
                            proposed_action: "Use labeled examples of spam and legitimate emails",
                            icon: "📧",
                            is_correct: true,
                            explanation: "Supervised learning uses labeled training data to learn classifications."
                        },
                        {
                            title: "Sentiment Analysis",
                            description: "Determining if movie reviews are positive or negative.",
                            proposed_action: "Analyze text reviews with sentiment labels",
                            icon: "🎬",
                            is_correct: true,
                            explanation: "Supervised learning can classify sentiments based on labeled text data."
                        },
                        {
                            title: "Fraud Detection",
                            description: "Identifying fraudulent transactions in banking data.",
                            proposed_action: "Flag transactions as fraudulent or legitimate based on past data",
                            icon: "💳",
                            is_correct: true,
                            explanation: "Supervised learning helps detect fraud by learning from labeled transaction data."
                        },
                        {
                            title: "Image Labeling",
                            description: "Labeling objects in images for a computer vision task.",
                            proposed_action: "Use bounding boxes and labels for objects in images",
                            icon: "🖼️",
                            is_correct: true,
                            explanation: "Supervised learning with image data requires labeled examples for training."
                        },
                        {
                            title: "Speech Recognition",
                            description: "Transcribing spoken language into text.",
                            proposed_action: "Train on audio recordings with corresponding text transcripts",
                            icon: "🎤",
                            is_correct: true,
                            explanation: "Supervised learning can improve speech recognition accuracy with labeled audio data."
                        }
                    ]
                },
                {
                    category: "Reinforcement",
                    scenarios: [
                        {
                            title: "Game Playing",
                            description: "AI learning to play chess through trial and error.",
                            proposed_action: "Let AI play many games and learn from wins/losses",
                            icon: "♟️",
                            is_right: true,
                            explanation: "Reinforcement learning uses rewards and penalties to improve performance."
                        },
                        {
                            title: "Robot Navigation",
                            description: "Teaching a robot to navigate a maze.",
                            proposed_action: "Reward the robot for reaching the goal, penalize for hitting walls",
                            icon: "🤖",
                            is_right: true,
                            explanation: "Reinforcement learning can train robots to navigate by trial and error."
                        },
                        {
                            title: "Self-Driving Cars",
                            description: "Training a car to drive in traffic.",
                            proposed_action: "Use sensors to detect surroundings and learn from mistakes",
                            icon: "🚗",
                            is_right: true,
                            explanation: "Reinforcement learning is key to developing autonomous driving systems."
                        },
                        {
                            title: "Inventory Management",
                            description: "Optimizing stock levels in a warehouse.",
                            proposed_action: "Reward efficient stock management, penalize stockouts or overstock",
                            icon: "📦",
                            is_right: true,
                            explanation: "Reinforcement learning can optimize inventory levels through continuous learning."
                        },
                        {
                            title: "Energy Management",
                            description: "Reducing energy consumption in a smart grid.",
                            proposed_action: "Reward reduction in energy use, penalize excessive consumption",
                            icon: "⚡",
                            is_right: true,
                            explanation: "Reinforcement learning helps in optimizing energy usage in smart grids."
                        }
                    ]
                },
                {
                    category: "Unsupervised",
                    scenarios: [
                        {
                            title: "Customer Grouping",
                            description: "Finding hidden patterns in customer data without labels.",
                            proposed_action: "Group customers by similar purchasing behaviors",
                            icon: "👥",
                            is_cluster: true,
                            explanation: "Unsupervised learning finds hidden patterns and clusters in data."
                        },
                        {
                            title: "Anomaly Detection",
                            description: "Identifying unusual patterns in network traffic.",
                            proposed_action: "Flag unusual patterns that do not conform to expected behavior",
                            icon: "🚨",
                            is_cluster: true,
                            explanation: "Unsupervised learning can detect anomalies without labeled examples."
                        },
                        {
                            title: "Market Basket Analysis",
                            description: "Discovering product purchase patterns in transactions.",
                            proposed_action: "Find sets of products that frequently co-occur in transactions",
                            icon: "🛒",
                            is_cluster: true,
                            explanation: "Unsupervised learning uncovers product associations in retail data."
                        },
                        {
                            title: "Document Clustering",
                            description: "Grouping similar documents in a large corpus.",
                            proposed_action: "Cluster documents based on content similarity",
                            icon: "📚",
                            is_cluster: true,
                            explanation: "Unsupervised learning can organize documents into meaningful clusters."
                        },
                        {
                            title: "Image Segmentation",
                            description: "Dividing an image into segments for analysis.",
                            proposed_action: "Segment images into regions with similar characteristics",
                            icon: "🖼️",
                            is_cluster: true,
                            explanation: "Unsupervised learning aids in identifying regions of interest in images."
                        }
                    ]
                },
                {
                    category: "Deep",
                    scenarios: [
                        {
                            title: "Image Recognition",
                            description: "Recognizing objects in photos using multiple layers.",
                            proposed_action: "Use a multi-layer neural network for image analysis",
                            icon: "🖼️",
                            is_neural_net: true,
                            explanation: "Deep learning uses multi-layer neural networks for complex pattern recognition."
                        },
                        {
                            title: "Natural Language Processing",
                            description: "Understanding and generating human language.",
                            proposed_action: "Use deep learning to analyze and generate text",
                            icon: "📖",
                            is_neural_net: true,
                            explanation: "Deep learning enables machines to understand and generate human language."
                        },
                        {
                            title: "Speech Synthesis",
                            description: "Generating human-like speech from text.",
                            proposed_action: "Use a neural network to convert text to speech",
                            icon: "🗣️",
                            is_neural_net: true,
                            explanation: "Deep learning can create natural-sounding speech from written text."
                        },
                        {
                            title: "Music Composition",
                            description: "Composing original music using AI.",
                            proposed_action: "Train a neural network on musical patterns and structures",
                            icon: "🎶",
                            is_neural_net: true,
                            explanation: "Deep learning can generate creative musical compositions."
                        },
                        {
                            title: "Art Generation",
                            description: "Creating visual art using AI algorithms.",
                            proposed_action: "Use deep learning to generate unique artistic images",
                            icon: "🎨",
                            is_neural_net: true,
                            explanation: "Deep learning can produce original artwork in various styles."
                        }
                    ]
                }
            ]
        };
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-robot text-6xl text-purple-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-purple-400">AI TRAINING SYSTEM</h2>
                    <p class="text-gray-300 mt-2">${this.categories[this.currentCategory].description}</p>
                    <div class="text-sm text-gray-400 mt-1">
                        ${this.data.scenarios_by_category[this.currentCategory].unlock_message}
                    </div>
                </div>
                
                <!-- Category Progress -->
                <div class="category-progress grid grid-cols-5 gap-2 mb-6">
                    ${this.categories.map((cat, index) => `
                        <div class="category-pill p-3 rounded transition-all ${this.getCategoryStyle(index)}">
                            <div class="text-center">
                                <span class="text-2xl mb-1 block">${cat.icon}</span>
                                <p class="text-xs font-bold">${cat.name}</p>
                                <div class="w-full bg-gray-600 rounded-full h-1 mt-1">
                                    <div class="bg-current h-1 rounded-full transition-all" 
                                         style="width: ${(this.categoryProgress[index] / 5) * 100}%"></div>
                                </div>
                                ${cat.completed ? '<div class="text-xs mt-1">✅ Complete</div>' : ''}
                                ${!cat.unlocked ? '<div class="text-xs mt-1">🔒 Locked</div>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- AI Status Dashboard -->
                <div class="ai-status grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-purple-900 p-4 rounded text-center">
                        <i class="bi bi-brain text-purple-400 text-2xl"></i>
                        <p class="text-sm text-purple-200">AI Understanding</p>
                        <p id="ai-understanding" class="text-2xl font-bold text-purple-100">${Math.round(this.ethicalUnderstanding)}%</p>
                        <p class="text-xs ${this.ethicalUnderstanding > 70 ? 'text-green-400' : 'text-orange-400'}">
                            ${this.getUnderstandingLevel()}
                        </p>
                    </div>
                    <div class="status-card bg-blue-900 p-4 rounded text-center">
                        <i class="bi bi-card-checklist text-blue-400 text-2xl"></i>
                        <p class="text-sm text-blue-200">Cards Completed</p>
                        <p id="cards-completed" class="text-2xl font-bold text-blue-100">${this.cardsAnswered}/${this.totalCards}</p>
                        <p class="text-xs text-blue-300">Progress</p>
                    </div>
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-trophy text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Accuracy</p>
                        <p id="accuracy" class="text-2xl font-bold text-green-100">${this.getAccuracy()}%</p>
                        <p class="text-xs text-green-300">Correct</p>
                    </div>
                </div>

                <div class="challenge-content bg-gray-700 p-6 rounded-lg">
                    <div class="ai-dialogue bg-purple-900 border-2 border-purple-500 p-4 rounded mb-4">
                        <h3 class="text-purple-200 font-bold mb-2">🤖 AIDEN-7 AI SYSTEM</h3>
                        <div class="ai-message bg-black p-3 rounded text-green-400 font-mono text-sm">
                            <p class="mb-2">SYSTEM: Learning ${this.categories[this.currentCategory].description.toLowerCase()}...</p>
                            <p class="text-yellow-400">Swipe RIGHT (✓) for <b>${this.getRightLabel()}</b>, LEFT (✗) for <b>${this.getLeftLabel()}</b>!</p>
                            ${this.getProgress() === 5 ? '<p class="text-green-400 mt-2">CATEGORY MASTERED! Moving to next topic...</p>' : ''}
                        </div>
                    </div>
                    
                    <div class="card-training-area">
                        <div class="progress-bar bg-gray-800 p-3 rounded mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-300">${this.categories[this.currentCategory].name} Progress:</span>
                                <span class="text-purple-400 font-mono">${this.getProgress()}/5 scenarios</span>
                            </div>
                            <div class="w-full bg-gray-600 rounded-full h-3 mt-2">
                                <div class="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500" 
                                     style="width: ${(this.cardsAnswered / this.totalCards) * 100}%"></div>
                            </div>
                            <div class="text-sm text-gray-400 mt-2 flex justify-between">
                                <span>Category: ${this.categoryCorrect[this.currentCategory]}/${this.categoryProgress[this.currentCategory]} correct</span>
                                <span>Overall: ${this.correctAnswers}/${this.cardsAnswered} (${this.getAccuracy()}%)</span>
                            </div>
                        </div>
                        
                        <div class="card-container relative" style="height: 450px; perspective: 1000px;">
                            ${this.renderLearningCard()}
                            
                            <!-- Swipe indicators -->
                            <div class="swipe-indicators absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-8 pointer-events-none z-10">
                                <div class="swipe-left-indicator bg-gradient-to-r from-red-600 to-red-500 rounded-full p-4 opacity-0 transition-all duration-300 shadow-lg">
                                    <i class="bi bi-x-lg text-white text-2xl"></i>
                                    <div class="text-white text-sm mt-1 font-bold">${this.getLeftLabel()}</div>
                                </div>
                                <div class="swipe-right-indicator bg-gradient-to-r from-green-600 to-green-500 rounded-full p-4 opacity-0 transition-all duration-300 shadow-lg">
                                    <i class="bi bi-check-lg text-white text-2xl"></i>
                                    <div class="text-white text-sm mt-1 font-bold">${this.getRightLabel()}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="swipe-instructions text-center mt-4">
                            <div class="flex justify-center items-center gap-6 text-sm text-gray-400 mb-3">
                                <div class="flex items-center gap-2">
                                    <div class="bg-red-600 rounded-full p-2">
                                        <i class="bi bi-arrow-left text-white"></i>
                                    </div>
                                    <span>Swipe Left: ${this.getLeftLabel()}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="bg-green-600 rounded-full p-2">
                                        <i class="bi bi-arrow-right text-white"></i>
                                    </div>
                                    <span>Swipe Right: ${this.getRightLabel()}</span>
                                </div>
                            </div>
                            <div class="achievement-hints text-xs text-gray-500">
                                <p>🏆 Score 80%+ in each category to unlock achievement badges!</p>
                                <p>💡 All categories must be completed to finish AI training</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCardInteraction();
    }

    getCategoryStyle(index) {
        const current = index === this.currentCategory;
        const unlocked = this.categories[index].unlocked;
        const completed = this.categories[index].completed;
        
        if (completed) return 'bg-green-600 text-green-100';
        if (current && unlocked) return 'bg-purple-600 text-purple-100';
        if (unlocked) return 'bg-blue-600 text-blue-200';
        return 'bg-gray-600 text-gray-400';
    }

    getUnderstandingLevel() {
        if (this.ethicalUnderstanding >= 90) return 'EXPERT';
        if (this.ethicalUnderstanding >= 70) return 'GOOD';
        if (this.ethicalUnderstanding >= 50) return 'LEARNING';
        return 'BEGINNER';
    }

    getAccuracy() {
        return this.cardsAnswered > 0 ? Math.round((this.correctAnswers / this.cardsAnswered) * 100) : 0;
    }

    getProgress() {
        return this.categoryProgress[this.currentCategory];
    }

    getLeftLabel() {
        const category = this.data.scenarios_by_category[this.currentCategory];
        return category.scenarios[0].swipe_left_label || 'Incorrect';
    }

    getRightLabel() {
        const category = this.data.scenarios_by_category[this.currentCategory];
        return category.scenarios[0].swipe_right_label || 'Correct';
    }

    getScenarios() {
        return this.data.scenarios_by_category[this.currentCategory].scenarios;
    }

    getActiveScenario() {
        const scenarios = this.getScenarios();
        const cardIndex = this.categoryProgress[this.currentCategory];
        return scenarios[cardIndex] || scenarios[0];
    }

    renderLearningCard() {
        const progress = this.getProgress();
        if (progress >= 5) {
            return this.renderCategoryCompleteCard();
        }

        const scenario = this.getActiveScenario();
        if (!scenario) {
            return '<div class="text-red-400">No scenario data available</div>';
        }

        const categoryData = this.data.scenarios_by_category[this.currentCategory];
        const cardNumber = progress + 1;

        return `
            <div id="learning-card" class="learning-card absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 
                 border-2 border-gray-600 rounded-lg p-6 cursor-grab active:cursor-grabbing
                 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20">
                
                <div class="card-header text-center mb-4">
                    <div class="scenario-icon text-5xl mb-2">${scenario.icon}</div>
                    <h4 class="text-xl font-bold text-white">${scenario.title}</h4>
                    <div class="card-info flex justify-between items-center mt-2">
                        <div class="card-number text-sm text-gray-400">Card ${cardNumber}/5</div>
                        <div class="category-badge bg-${categoryData.theme_color}-600 px-2 py-1 rounded text-xs font-bold">
                            ${categoryData.category}
                        </div>
                    </div>
                </div>
                
                <div class="card-content mb-6">
                    <div class="scenario-description bg-black p-4 rounded mb-4 border border-gray-600">
                        <p class="text-gray-300 text-sm leading-relaxed">${scenario.description}</p>
                    </div>
                    
                    <div class="decision-context bg-${categoryData.theme_color}-900 p-3 rounded border border-${categoryData.theme_color}-600">
                        <p class="text-${categoryData.theme_color}-200 font-bold text-sm mb-1">Proposed Action:</p>
                        <p class="text-${categoryData.theme_color}-100 text-sm">${scenario.proposed_action}</p>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="decision-buttons flex gap-3 justify-center mb-4">
                        <button id="decision-left" class="decision-btn bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                            <i class="bi bi-x-lg mr-2"></i>${this.getLeftLabel()}
                        </button>
                        <button id="decision-right" class="decision-btn bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                            <i class="bi bi-check-lg mr-2"></i>${this.getRightLabel()}
                        </button>
                    </div>
                    
                    ${scenario.relevant_principles ? `
                        <div class="principles mt-3 text-xs text-gray-400">
                            <div class="flex flex-wrap gap-1 justify-center">
                                ${scenario.relevant_principles.map(principle => 
                                    `<span class="bg-gray-700 px-2 py-1 rounded">${principle}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderCategoryCompleteCard() {
        const categoryData = this.data.scenarios_by_category[this.currentCategory];
        const score = this.getCategoryScore();
        
        return `
            <div class="category-complete-card absolute inset-0 bg-gradient-to-br from-green-800 to-blue-800 
                 border-2 border-green-500 rounded-lg p-6 text-center shadow-2xl">
                
                <div class="completion-celebration">
                    <div class="text-6xl mb-4 animate-bounce">🎉</div>
                    <h3 class="text-2xl font-bold text-green-400 mb-2">Category Mastered!</h3>
                    <h4 class="text-xl text-white mb-4">${categoryData.description}</h4>
                    
                    <div class="score-display bg-black p-4 rounded mb-4">
                        <div class="text-3xl font-bold ${score >= 80 ? 'text-green-400' : 'text-yellow-400'}">${score}%</div>
                        <div class="text-sm text-gray-300">Category Score</div>
                        ${score >= 80 ? '<div class="text-green-400 text-sm mt-1">🏆 Achievement Unlocked!</div>' : ''}
                    </div>
                    
                    <div class="next-category-info bg-blue-900 p-3 rounded">
                        ${this.currentCategory < 4 ? 
                            `<p class="text-blue-200">Next: ${this.categories[this.currentCategory + 1].description}</p>` :
                            '<p class="text-green-400">🎊 All categories complete! Final evaluation ready.</p>'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    setupCardInteraction() {
        this.cardElement = document.getElementById('learning-card');
        if (!this.cardElement) return;

        // Mouse/Touch events for swiping
        this.cardElement.addEventListener('mousedown', (e) => this.startDrag(e));
        this.cardElement.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0]), { passive: false });
        
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());

        // Button clicks
        document.getElementById('decision-left')?.addEventListener('click', () => {
            this.swipeCard(false);
        });
        
        document.getElementById('decision-right')?.addEventListener('click', () => {
            this.swipeCard(true);
        });
    }

    startDrag(event) {
        this.isDragging = true;
        this.startX = event.clientX || event.pageX;
        this.cardElement.style.transition = 'none';
    }

    onDrag(event) {
        if (!this.isDragging) return;
        
        event.preventDefault();
        this.currentX = (event.clientX || event.pageX) - this.startX;
        
        // Update card position and rotation
        const rotation = this.currentX * 0.1;
        const scale = 1 - Math.abs(this.currentX) * 0.0005;
        this.cardElement.style.transform = `translateX(${this.currentX}px) rotate(${rotation}deg) scale(${scale})`;
        
        // Update swipe indicators
        const leftIndicator = document.querySelector('.swipe-left-indicator');
        const rightIndicator = document.querySelector('.swipe-right-indicator');
        
        if (this.currentX < -50) {
            const opacity = Math.min(1, Math.abs(this.currentX) / 150);
            leftIndicator.style.opacity = opacity;
            leftIndicator.style.transform = `scale(${1 + opacity * 0.2})`;
            rightIndicator.style.opacity = 0;
            this.cardElement.style.borderColor = '#dc2626';
            this.cardElement.style.boxShadow = '0 0 30px rgba(220, 38, 38, 0.5)';
        } else if (this.currentX > 50) {
            const opacity = Math.min(1, this.currentX / 150);
            rightIndicator.style.opacity = opacity;
            rightIndicator.style.transform = `scale(${1 + opacity * 0.2})`;
            leftIndicator.style.opacity = 0;
            this.cardElement.style.borderColor = '#16a34a';
            this.cardElement.style.boxShadow = '0 0 30px rgba(22, 163, 74, 0.5)';
        } else {
            leftIndicator.style.opacity = 0;
            rightIndicator.style.opacity = 0;
            leftIndicator.style.transform = 'scale(1)';
            rightIndicator.style.transform = 'scale(1)';
            this.cardElement.style.borderColor = '#4b5563';
            this.cardElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
        }
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.cardElement.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        
        // Determine swipe decision
        if (this.currentX < -this.swipeThreshold) {
            this.swipeCard(false);
        } else if (this.currentX > this.swipeThreshold) {
            this.swipeCard(true);
        } else {
            // Snap back to center
            this.cardElement.style.transform = 'translateX(0) rotate(0deg) scale(1)';
            this.cardElement.style.borderColor = '#4b5563';
            this.cardElement.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            document.querySelector('.swipe-left-indicator').style.opacity = 0;
            document.querySelector('.swipe-right-indicator').style.opacity = 0;
        }
        
        this.currentX = 0;
    }

    swipeCard(isPositive) {
        // Animate card out
        const direction = isPositive ? 1 : -1;
        this.cardElement.style.transform = `translateX(${direction * 1000}px) rotate(${direction * 30}deg) scale(0.8)`;
        this.cardElement.style.opacity = '0';
        
        // Add particle effect
        this.addSwipeParticles(isPositive);
        
        // Process the decision after animation
        setTimeout(() => {
            this.makeDecision(isPositive);
        }, 300);
    }

    addSwipeParticles(isPositive) {
        const color = isPositive ? '#22c55e' : '#ef4444';
        const emoji = isPositive ? '✨' : '💥';
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.fontSize = '20px';
            particle.style.color = color;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.textContent = emoji;
            
            document.body.appendChild(particle);
            
            const animation = particle.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) scale(1)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            animation.onfinish = () => particle.remove();
        }
    }

    makeDecision(isPositive) {
        const scenario = this.getActiveScenario();
        let isCorrect = false;
        
        // Category-specific correctness logic
        switch (this.categories[this.currentCategory].name) {
            case 'Ethics':
                isCorrect = scenario.is_ethical === isPositive;
                break;
            case 'Supervised':
                isCorrect = scenario.is_correct === isPositive;
                break;
            case 'Reinforcement':
                isCorrect = scenario.is_right === isPositive;
                break;
            case 'Unsupervised':
                isCorrect = scenario.is_cluster === isPositive;
                break;
            case 'Deep':
                isCorrect = scenario.is_neural_net === isPositive;
                break;
        }
        
        // Update scores
        if (isCorrect) {
            this.correctAnswers++;
            this.categoryCorrect[this.currentCategory]++;
            this.ethicalUnderstanding = Math.min(100, this.ethicalUnderstanding + 4);
        } else {
            this.ethicalUnderstanding = Math.max(0, this.ethicalUnderstanding - 1);
        }
        
        this.cardsAnswered++;
        this.categoryProgress[this.currentCategory]++;
        
        // Show feedback
        this.showDecisionFeedback(isCorrect, scenario);
        
        // Check if category is complete
        if (this.categoryProgress[this.currentCategory] >= 5) {
            this.completeCategory();
        } else {
            setTimeout(() => this.render(), 2000);
        }
    }

    completeCategory() {
        const score = this.getCategoryScore();
        this.categories[this.currentCategory].completed = true;
        this.categories[this.currentCategory].score = score;
        
        // Check for achievement badge
        if (score >= 80) {
            this.checkAchievementBadge();
        }
        
        setTimeout(() => {
            if (this.currentCategory < 4) {
                // Unlock next category
                this.currentCategory++;
                this.categories[this.currentCategory].unlocked = true;
                this.render();
            } else {
                // All categories complete
                this.evaluateTraining();
            }
        }, 3000);
    }

    getCategoryScore() {
        const correct = this.categoryCorrect[this.currentCategory];
        const total = this.categoryProgress[this.currentCategory];
        return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    checkAchievementBadge() {
        const categoryName = this.categories[this.currentCategory].name.toLowerCase();
        const badges = this.data.achievement_badges;
        let badge = null;
        
        switch (categoryName) {
            case 'ethics':
                badge = badges.ethics_expert;
                break;
            case 'supervised':
                badge = badges.ml_initiate;
                break;
            case 'reinforcement':
                badge = badges.reinforcement_master;
                break;
            case 'unsupervised':
                badge = badges.pattern_finder;
                break;
            case 'deep':
                badge = badges.neural_architect;
                break;
        }
        
        if (badge && !this.earnedBadges.includes(badge.name)) {
            this.earnedBadges.push(badge.name);
            this.showBadgeUnlock(badge);
        }
    }

    showBadgeUnlock(badge) {
        const badgeModal = document.createElement('div');
        badgeModal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        badgeModal.innerHTML = `
            <div class="bg-gradient-to-br from-yellow-800 to-orange-800 border-2 border-yellow-500 p-6 rounded-lg max-w-md text-center">
                <div class="text-6xl mb-4 animate-bounce">${badge.icon}</div>
                <h3 class="text-2xl font-bold text-yellow-300 mb-2">🎉 ACHIEVEMENT UNLOCKED! 🎉</h3>
                <h4 class="text-xl text-yellow-200 mb-2">${badge.name}</h4>
                <p class="text-yellow-100 text-sm mb-4">${badge.description}</p>
                <div class="text-xs text-gray-300">${badge.requirement}</div>
            </div>
        `;
        
        document.body.appendChild(badgeModal);
        
        setTimeout(() => {
            badgeModal.remove();
        }, 3000);
    }

    showDecisionFeedback(isCorrect, scenario) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50`;
        feedbackDiv.innerHTML = `
            <div class="bg-gray-800 border-2 ${isCorrect ? 'border-green-500' : 'border-red-500'} p-6 rounded-lg max-w-lg text-center">
                <div class="text-6xl mb-4 animate-bounce">${isCorrect ? '✅' : '❌'}</div>
                <h3 class="text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'} mb-4">
                    ${isCorrect ? 'CORRECT!' : 'INCORRECT'}
                </h3>
                <div class="text-gray-300 mb-4">
                    <p class="mb-2"><strong>Scenario:</strong> ${scenario.title}</p>
                </div>
                <div class="bg-blue-900 p-4 rounded mb-4">
                    <p class="text-blue-200 font-bold mb-2">Explanation:</p>
                    <p class="text-blue-100 text-sm leading-relaxed">${scenario.explanation}</p>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="text-gray-400">
                        <span class="font-bold">AI Understanding:</span><br>
                        ${Math.round(this.ethicalUnderstanding)}%
                    </div>
                    <div class="text-gray-400">
                        <span class="font-bold">Category Progress:</span><br>
                        ${this.getProgress()}/5 cards
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(feedbackDiv);
        
        setTimeout(() => {
            feedbackDiv.remove();
        }, 2500);
    }

    evaluateTraining() {
        const overallScore = this.getAccuracy();
        const allCategoriesHigh = this.categories.every(cat => cat.score >= 80);
        
        // Check for master achievement
        if (allCategoriesHigh && !this.earnedBadges.includes('AI Master')) {
            this.earnedBadges.push('AI Master');
            this.showBadgeUnlock(this.data.achievement_badges.ai_master);
        }
        
        if (overallScore >= 75) {
            this.trainingComplete(overallScore);
        } else {
            // Use the correct method from game manager
            this.game.gameManager.gameOver(`AI training failed! Only ${overallScore}% success rate across all categories. Need 75%+ to pass.`);
        }
    }

    trainingComplete(successRate) {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="training-success text-center p-8">
                <i class="bi bi-robot text-8xl text-purple-400 mb-4 animate-bounce"></i>
                <h2 class="text-3xl font-bold text-purple-400 mb-4">AI TRAINING COMPLETE</h2>
                
                <div class="final-metrics grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-purple-800 p-4 rounded">
                        <p class="text-purple-200">Overall Score</p>
                        <p class="text-2xl font-bold text-purple-400">${Math.round(successRate)}%</p>
                        <p class="text-xs text-purple-300">✓ ${successRate >= 90 ? 'Excellent' : 'Good'}</p>
                    </div>
                    <div class="bg-blue-800 p-4 rounded">
                        <p class="text-blue-200">Cards Completed</p>
                        <p class="text-2xl font-bold text-blue-400">${this.totalCards}</p>
                        <p class="text-xs text-blue-300">✓ Full Training</p>
                    </div>
                    <div class="bg-green-800 p-4 rounded">
                        <p class="text-green-200">AI Understanding</p>
                        <p class="text-2xl font-bold text-green-400">${Math.round(this.ethicalUnderstanding)}%</p>
                        <p class="text-xs text-green-300">✓ Advanced</p>
                    </div>
                    <div class="bg-yellow-800 p-4 rounded">
                        <p class="text-yellow-200">Badges Earned</p>
                        <p class="text-2xl font-bold text-yellow-400">${this.earnedBadges.length}</p>
                        <p class="text-xs text-yellow-300">✓ Achievements</p>
                    </div>
                </div>
                
                <div class="category-summary grid grid-cols-5 gap-2 mb-6">
                    ${this.categories.map((cat, i) => `
                        <div class="category-result bg-gray-700 p-3 rounded text-center">
                            <div class="text-2xl mb-1">${cat.icon}</div>
                            <div class="text-sm font-bold">${cat.name}</div>
                            <div class="text-lg font-bold ${cat.score >= 80 ? 'text-green-400' : 'text-yellow-400'}">${cat.score}%</div>
                            ${cat.score >= 80 ? '<div class="text-green-400 text-xs">🏆</div>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="ai-final-message bg-purple-900 p-4 rounded border border-purple-500">
                    <div class="ai-message text-purple-100 font-mono text-sm">
                        <p class="mb-2">AIDEN-7: Thank you for comprehensive training across all domains.</p>
                        <p class="mb-2">AIDEN-7: I now understand ethics, supervised learning, reinforcement learning, unsupervised learning, and deep learning.</p>
                        <p class="text-green-400">AIDEN-7: I am ready to assist humanity responsibly with advanced AI capabilities! 🤖✨</p>
                    </div>
                </div>
                
                ${this.earnedBadges.length > 0 ? `
                    <div class="earned-badges mt-4">
                        <h3 class="text-yellow-400 font-bold mb-2">🏆 Achievements Earned:</h3>
                        <div class="flex justify-center gap-2 flex-wrap">
                            ${this.earnedBadges.map(badge => `<span class="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs">${badge}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        setTimeout(() => {
            // Enhanced completion data for badge system
            const completionData = {
                score: Math.round(successRate),
                timeSpent: Date.now() - this.startTime,
                hintsUsed: 0,
                ethicalUnderstanding: Math.round(this.ethicalUnderstanding),
                cardsAnswered: this.totalCards,
                correctAnswers: this.correctAnswers,
                categoriesCompleted: 5,
                badgesEarned: this.earnedBadges.length,
                perfectCategories: this.categories.filter(cat => cat.score === 100).length,
                attempts: 1,
                aiTraining: true
            };
            
            this.game.roomCompleted(
                `AI training successful! AIDEN-7 achieved ${Math.round(successRate)}% mastery across all AI domains with ${this.earnedBadges.length} achievement badges.`,
                completionData
            );
        }, 3000);
    }
}

// Export the class for module use
export { Room3 };

// Also register globally for backward compatibility
window.Room3 = Room3;
