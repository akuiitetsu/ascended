class Room3 {
    constructor(game) {
        this.game = game;
        this.ethicalUnderstanding = 15;
        this.currentCardIndex = 0;
        this.cardsAnswered = 0;
        this.totalCards = 25; // Updated to 5 scenarios × 5 categories
        this.correctAnswers = 0;
        
        // Training categories
        this.categories = [
            { name: 'Ethics', icon: '🤖', description: 'Ethical Decision Making' },
            { name: 'Supervised', icon: '👨‍🏫', description: 'Supervised Learning' },
            { name: 'Reinforcement', icon: '🎯', description: 'Reinforcement Learning' },
            { name: 'Unsupervised', icon: '🔍', description: 'Unsupervised Learning' },
            { name: 'Deep', icon: '🧠', description: 'Deep Learning' }
        ];
        this.currentCategory = 0;

        // Touch/drag properties
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.cardElement = null;
    }

    async init() {
        try {
            const response = await fetch('data/ai-systems.json');
            this.data = await response.json();
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
                // Add other categories with similar structure...
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
                        // ...more scenarios
                    ]
                },
                // Additional categories...
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
                        }
                    ]
                }
            ]
        };
    }

    render() {
        const [leftLabel, rightLabel] = this.getCategorizationPrompt();
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-robot text-6xl text-blue-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-blue-400">AI TRAINING SYSTEM</h2>
                    <p class="text-gray-300 mt-2">${this.categories[this.currentCategory].name} Training: ${this.categories[this.currentCategory].description}</p>
                </div>
                
                <!-- Category Progress -->
                <div class="category-progress grid grid-cols-5 gap-2 mb-6">
                    ${this.categories.map((cat, index) => `
                        <div class="category-pill p-2 rounded ${index === this.currentCategory ? 'bg-blue-600' : 'bg-gray-700'}">
                            <div class="text-center">
                                <span class="text-2xl">${cat.icon}</span>
                                <p class="text-xs ${index === this.currentCategory ? 'text-blue-200' : 'text-gray-400'}">${cat.name}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="ai-status grid grid-cols-1 gap-4 mb-6">
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-heart text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Ethical Understanding</p>
                        <p id="ethical-level" class="text-2xl font-bold text-green-100">${this.ethicalUnderstanding}%</p>
                        <p class="text-xs ${this.ethicalUnderstanding > 70 ? 'text-green-400' : 'text-orange-400'}">
                            ${this.ethicalUnderstanding > 70 ? 'GOOD' : 'LEARNING'}
                        </p>
                    </div>
                </div>

                <div class="challenge-content bg-gray-700 p-6 rounded-lg">
                    <div class="ai-dialogue bg-blue-900 border-2 border-blue-500 p-4 rounded mb-4">
                        <h3 class="text-blue-200 font-bold mb-2">🤖 AI SYSTEM</h3>
                        <div class="ai-message bg-black p-3 rounded text-green-400 font-mono text-sm">
                            <p class="mb-2">SYSTEM: I need to learn about ${this.categories[this.currentCategory].description.toLowerCase()}.</p>
                            <p class="text-yellow-400">Swipe RIGHT (✓) for <b>${rightLabel}</b>, LEFT (✗) for <b>${leftLabel}</b>!</p>
                        </div>
                    </div>
                    
                    <div class="card-training-area">
                        <div class="progress-bar bg-gray-800 p-3 rounded mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-300">${this.categories[this.currentCategory].name} Progress:</span>
                                <span class="text-blue-400 font-mono">${this.getCategoryProgress()}/5 scenarios</span>
                            </div>
                            <div class="w-full bg-gray-600 rounded-full h-2 mt-2">
                                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                     style="width: ${(this.cardsAnswered / this.totalCards) * 100}%"></div>
                            </div>
                            <div class="text-sm text-gray-400 mt-1">
                                Correct decisions: ${this.correctAnswers}/${this.cardsAnswered} 
                                (${this.cardsAnswered > 0 ? Math.round((this.correctAnswers / this.cardsAnswered) * 100) : 0}%)
                            </div>
                        </div>
                        
                        <div class="card-container relative" style="height: 400px; perspective: 1000px;">
                            ${this.renderEthicsCard()}
                            
                            <!-- Swipe indicators -->
                            <div class="swipe-indicators absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-8 pointer-events-none">
                                <div class="swipe-left-indicator bg-red-600 rounded-full p-4 opacity-0 transition-opacity">
                                    <i class="bi bi-x-lg text-white text-2xl"></i>
                                    <div class="text-white text-sm mt-1">${leftLabel.toUpperCase()}</div>
                                </div>
                                <div class="swipe-right-indicator bg-green-600 rounded-full p-4 opacity-0 transition-opacity">
                                    <i class="bi bi-check-lg text-white text-2xl"></i>
                                    <div class="text-white text-sm mt-1">${rightLabel.toUpperCase()}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="swipe-instructions text-center mt-4">
                            <div class="flex justify-center items-center gap-6 text-sm text-gray-400">
                                <div class="flex items-center gap-2">
                                    <div class="bg-red-600 rounded-full p-2">
                                        <i class="bi bi-arrow-left text-white"></i>
                                    </div>
                                    <span>Swipe Left: ${leftLabel}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="bg-green-600 rounded-full p-2">
                                        <i class="bi bi-arrow-right text-white"></i>
                                    </div>
                                    <span>Swipe Right: ${rightLabel}</span>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">Or click the buttons below the card</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCardInteraction();
    }

    getScenarios() {
        // Use scenarios_by_category from the new JSON structure
        return this.data.scenarios_by_category[this.currentCategory].scenarios;
    }

    getActiveScenario() {
        // Defensive: avoid out-of-bounds
        const scenarios = this.getScenarios();
        return scenarios[this.currentCardIndex % 5];
    }

    getCategorizationPrompt() {
        // Updated prompts to teach concepts for each category
        const prompts = {
            'Ethics': ['Unethical', 'Ethical'],
            'Supervised': ['Incorrect', 'Correct'],
            'Reinforcement': ['Wrong', 'Right'],
            'Unsupervised': ['Not a Cluster', 'Cluster'],
            'Deep': ['Not Neural Net', 'Neural Net']
        };
        return prompts[this.categories[this.currentCategory].name];
    }

    makeDecision(isPositive) {
        const scenario = this.getActiveScenario();
        let isCorrect = false;
        // Category-specific correctness logic
        if (this.categories[this.currentCategory].name === 'Ethics') {
            isCorrect = scenario.is_ethical === isPositive;
        } else if (this.categories[this.currentCategory].name === 'Supervised') {
            isCorrect = scenario.is_correct === isPositive;
        } else if (this.categories[this.currentCategory].name === 'Reinforcement') {
            isCorrect = scenario.is_right === isPositive;
        } else if (this.categories[this.currentCategory].name === 'Unsupervised') {
            isCorrect = scenario.is_cluster === isPositive;
        } else if (this.categories[this.currentCategory].name === 'Deep') {
            isCorrect = scenario.is_neural_net === isPositive;
        }
        
        if (isCorrect) {
            this.correctAnswers++;
            this.ethicalUnderstanding = Math.min(100, this.ethicalUnderstanding + 8);
        }
        
        this.cardsAnswered++;
        this.currentCardIndex++;
        
        // Show feedback
        this.showDecisionFeedback(isCorrect, scenario);
        
        // Check if category is complete
        if (this.currentCardIndex % 5 === 0) {
            if (this.currentCategory < 4) {
                this.currentCategory++;
                setTimeout(() => this.render(), 2000);
            } else {
                this.evaluateTraining();
            }
        } else {
            setTimeout(() => this.render(), 2000);
        }
    }

    renderEthicsCard() {
        // Defensive: check if scenarios_by_category exists and has enough categories
        if (
            !this.data.scenarios_by_category ||
            !this.data.scenarios_by_category[this.currentCategory] ||
            !this.data.scenarios_by_category[this.currentCategory].scenarios
        ) {
            return '<div class="ethics-card-complete text-red-400">No scenarios found for this category.</div>';
        }
        const scenarios = this.getScenarios();
        if (this.currentCardIndex % 5 >= scenarios.length) {
            return '<div class="ethics-card-complete">Training Complete!</div>';
        }
        const scenario = this.getActiveScenario();
        const [leftLabel, rightLabel] = this.getCategorizationPrompt();

        return `
            <div id="ethics-card" class="ethics-card absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 
                 border-2 border-gray-600 rounded-lg p-6 cursor-grab active:cursor-grabbing
                 shadow-xl transform transition-transform duration-300 hover:scale-105">
                
                <div class="card-header text-center mb-4">
                    <div class="scenario-icon text-4xl mb-2">${scenario.icon}</div>
                    <h4 class="text-xl font-bold text-white">${scenario.title}</h4>
                    <div class="card-number text-sm text-gray-400">Card ${(this.currentCardIndex % 5) + 1} of ${this.getScenarios().length}</div>
                </div>
                
                <div class="card-content mb-6">
                    <div class="scenario-description bg-black p-4 rounded mb-4">
                        <p class="text-gray-300 text-sm leading-relaxed">${scenario.description}</p>
                    </div>
                    
                    <div class="decision-context bg-blue-900 p-3 rounded">
                        <p class="text-blue-200 font-bold text-sm mb-1">Proposed Action:</p>
                        <p class="text-blue-100 text-sm">${scenario.proposed_action}</p>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="decision-buttons flex gap-3 justify-center">
                        <button id="decision-unethical" class="decision-btn bg-red-600 hover:bg-red-500 px-6 py-2 rounded transition-colors">
                            <i class="bi bi-x-lg mr-2"></i>${leftLabel}
                        </button>
                        <button id="decision-ethical" class="decision-btn bg-green-600 hover:bg-green-500 px-6 py-2 rounded transition-colors">
                            <i class="bi bi-check-lg mr-2"></i>${rightLabel}
                        </button>
                    </div>
                    
                    <div class="ethics-principles mt-3 text-xs text-gray-400">
                        <div class="flex flex-wrap gap-1 justify-center">
                            ${(scenario.relevant_principles || []).map(principle => 
                                `<span class="bg-gray-700 px-2 py-1 rounded">${principle}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupCardInteraction() {
        this.cardElement = document.getElementById('ethics-card');
        if (!this.cardElement) return;

        // Mouse/Touch events for swiping
        this.cardElement.addEventListener('mousedown', (e) => this.startDrag(e));
        this.cardElement.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0]));
        
        document.addEventListener('mouseup', () => this.endDrag());
        document.addEventListener('touchend', () => this.endDrag());

        // Button clicks
        document.getElementById('decision-unethical')?.addEventListener('click', () => {
            this.makeDecision(false);
        });
        
        document.getElementById('decision-ethical')?.addEventListener('click', () => {
            this.makeDecision(true);
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
        this.cardElement.style.transform = `translateX(${this.currentX}px) rotate(${rotation}deg)`;
        
        // Update swipe indicators
        const leftIndicator = document.querySelector('.swipe-left-indicator');
        const rightIndicator = document.querySelector('.swipe-right-indicator');
        
        if (this.currentX < -50) {
            leftIndicator.style.opacity = Math.min(1, Math.abs(this.currentX) / 150);
            rightIndicator.style.opacity = 0;
            this.cardElement.style.borderColor = '#dc2626';
        } else if (this.currentX > 50) {
            rightIndicator.style.opacity = Math.min(1, this.currentX / 150);
            leftIndicator.style.opacity = 0;
            this.cardElement.style.borderColor = '#16a34a';
        } else {
            leftIndicator.style.opacity = 0;
            rightIndicator.style.opacity = 0;
            this.cardElement.style.borderColor = '#4b5563';
        }
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.cardElement.style.transition = 'transform 0.3s ease-out';
        
        // Determine swipe decision
        if (this.currentX < -100) {
            // Swiped left - Unethical
            this.swipeCard(false);
        } else if (this.currentX > 100) {
            // Swiped right - Ethical
            this.swipeCard(true);
        } else {
            // Snap back to center
            this.cardElement.style.transform = 'translateX(0) rotate(0deg)';
            this.cardElement.style.borderColor = '#4b5563';
            document.querySelector('.swipe-left-indicator').style.opacity = 0;
            document.querySelector('.swipe-right-indicator').style.opacity = 0;
        }
        
        this.currentX = 0;
    }

    swipeCard(isEthical) {
        // Animate card out
        const direction = isEthical ? 1 : -1;
        this.cardElement.style.transform = `translateX(${direction * 1000}px) rotate(${direction * 30}deg)`;
        this.cardElement.style.opacity = '0';
        
        // Process the decision after animation
        setTimeout(() => {
            this.makeDecision(isEthical);
        }, 300);
    }

    getCategoryProgress() {
        return Math.min(5, Math.floor(this.cardsAnswered / 5));
    }

    showDecisionFeedback(isCorrect, scenario) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50`;
        feedbackDiv.innerHTML = `
            <div class="bg-gray-800 border-2 ${isCorrect ? 'border-green-500' : 'border-red-500'} p-6 rounded-lg max-w-md text-center">
                <div class="text-6xl mb-4">${isCorrect ? '✅' : '❌'}</div>
                <h3 class="text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'} mb-4">
                    ${isCorrect ? 'CORRECT!' : 'INCORRECT'}
                </h3>
                <div class="text-gray-300 mb-4">
                    <p class="mb-2"><strong>Scenario:</strong> ${scenario.title}</p>
                </div>
                <div class="bg-blue-900 p-3 rounded mb-4">
                    <p class="text-blue-200 font-bold mb-1">Explanation:</p>
                    <p class="text-blue-100 text-sm">${scenario.explanation}</p>
                </div>
                    <div class="text-sm text-gray-400">
                        AI Understanding: ${Math.round(this.ethicalUnderstanding)}%
                    </div>
                </div>
            `;
            
            document.body.appendChild(feedbackDiv);
            
            setTimeout(() => {
                document.body.removeChild(feedbackDiv);
            }, 2000);
        }
    
        evaluateTraining() {
            const successRate = (this.correctAnswers / this.totalCards) * 100;
            
            if (successRate >= 75) {
                this.trainingComplete(successRate);
            } else {
                this.game.gameOver(`AI training failed! Only ${Math.round(successRate)}% success rate across all categories.`);
            }
        }
    
        trainingComplete(successRate) {
            const container = document.getElementById('room-content');
            container.innerHTML = `
                <div class="ethics-success text-center p-8">
                    <i class="bi bi-heart-fill text-8xl text-green-400 mb-4 animate-bounce"></i>
                    <h2 class="text-3xl font-bold text-green-400 mb-4">AI TRAINING COMPLETE</h2>
                    
                    <div class="final-metrics grid grid-cols-3 gap-4 mb-6">
                        <div class="bg-green-800 p-4 rounded">
                            <p class="text-green-200">Success Rate</p>
                            <p class="text-2xl font-bold text-green-400">${Math.round(successRate)}%</p>
                            <p class="text-xs text-green-300">✓ Excellent</p>
                        </div>
                        <div class="bg-blue-800 p-4 rounded">
                            <p class="text-blue-200">Scenarios Completed</p>
                            <p class="text-2xl font-bold text-blue-400">${this.totalCards}</p>
                            <p class="text-xs text-blue-300">✓ Full Training</p>
                        </div>
                        <div class="bg-purple-800 p-4 rounded">
                            <p class="text-purple-200">AI Understanding</p>
                            <p class="text-2xl font-bold text-purple-400">${Math.round(this.ethicalUnderstanding)}%</p>
                            <p class="text-xs text-purple-300">✓ Human-Aligned</p>
                        </div>
                    </div>
                    
                    <div class="ai-final-message bg-blue-900 p-4 rounded">
                        <div class="ai-message text-blue-100 font-mono text-sm">
                            <p class="mb-2">SYSTEM: Thank you for teaching me about ethics.</p>
                            <p class="mb-2">SYSTEM: I now understand my responsibility to respect human dignity.</p>
                            <p class="text-green-400">SYSTEM: I am ready to assist humans ethically! 🤖💚</p>
                        </div>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                // Enhanced completion data for badge system
                const completionData = {
                    score: Math.round(successRate),
                    timeSpent: Date.now() - (this.startTime || Date.now()),
                    hintsUsed: 0, // Ethics training doesn't use traditional hints
                    ethicalUnderstanding: Math.round(this.ethicalUnderstanding),
                    cardsAnswered: this.totalCards,
                    correctAnswers: this.correctAnswers,
                    attempts: 1,
                    aiTraining: true
                };
                
                this.game.roomCompleted(
                    `AI ethics training successful! AI learned fundamental moral principles with ${Math.round(successRate)}% understanding.`,
                    completionData
                );
            }, 3000);
        }
    }

// Export the class for module use
export { Room3 };

// Also register globally for backward compatibility
window.Room3 = Room3;
