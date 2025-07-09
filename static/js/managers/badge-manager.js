export class BadgeManager {
    constructor(game) {
        this.game = game;
        this.recentlyEarnedBadges = [];
        this.fallbackBadges = this.initializeFallbackBadges();
    }

    initializeFallbackBadges() {
        return {
            1: [
                { id: 'flowchart_master', name: 'Flowchart Master', description: 'Complete the Flowchart Lab', icon: '📊', room_id: 1 },
                { id: 'logic_guru', name: 'Logic Guru', description: 'Master logical flow design', icon: '🧠', room_id: 1 },
                { id: 'process_expert', name: 'Process Expert', description: 'Design efficient processes', icon: '⚡', room_id: 1 }
            ],
            2: [
                { id: 'network_engineer', name: 'Network Engineer', description: 'Complete Network Nexus challenges', icon: '🌐', room_id: 2 },
                { id: 'topology_builder', name: 'Topology Builder', description: 'Master network topology design', icon: '🔧', room_id: 2 },
                { id: 'routing_specialist', name: 'Routing Specialist', description: 'Configure advanced routing', icon: '🛤️', room_id: 2 },
                { id: 'cli_master', name: 'CLI Master', description: 'Master command-line operations', icon: '💻', room_id: 2 }
            ],
            3: [
                { id: 'ai_specialist', name: 'AI Specialist', description: 'Complete AI Systems training', icon: '🤖', room_id: 3 },
                { id: 'ethics_guardian', name: 'Ethics Guardian', description: 'Demonstrate ethical AI understanding', icon: '⚖️', room_id: 3 },
                { id: 'neural_architect', name: 'Neural Architect', description: 'Design neural networks', icon: '🧠', room_id: 3 }
            ],
            4: [
                { id: 'database_admin', name: 'Database Administrator', description: 'Complete Database Crisis', icon: '🗄️', room_id: 4 },
                { id: 'query_optimizer', name: 'Query Optimizer', description: 'Optimize database performance', icon: '⚡', room_id: 4 },
                { id: 'data_architect', name: 'Data Architect', description: 'Design efficient data structures', icon: '🏗️', room_id: 4 }
            ],
            5: [
                { id: 'code_warrior', name: 'Code Warrior', description: 'Complete Programming Crisis', icon: '🐛', room_id: 5 },
                { id: 'debug_master', name: 'Debug Master', description: 'Fix critical bugs efficiently', icon: '🔍', room_id: 5 },
                { id: 'algorithm_expert', name: 'Algorithm Expert', description: 'Implement complex algorithms', icon: '🧮', room_id: 5 }
            ]
        };
    }

    async checkAndAwardRoomBadges(roomNumber, completionData = {}) {
        console.log(`Checking badges for room ${roomNumber} completion`);
        
        try {
            // Call API to check and award badges
            const response = await fetch('/api/user/check_badges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'credentials': 'include'
                },
                body: JSON.stringify({
                    room_number: roomNumber,
                    completion_data: completionData
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.new_badges && data.new_badges.length > 0) {
                    this.recentlyEarnedBadges = data.new_badges;
                    await this.showBadgeRewards(data.new_badges);
                    return data.new_badges;
                }
            }
            
            // If API fails or returns no badges, use fallback system
            console.log('API unavailable or no badges returned, using fallback system');
            return await this.checkFallbackBadges(roomNumber, completionData);
            
        } catch (error) {
            console.error('Failed to check badges via API:', error);
            // Use fallback system when API is unavailable
            return await this.checkFallbackBadges(roomNumber, completionData);
        }
    }

    async checkFallbackBadges(roomNumber, completionData) {
        console.log(`Checking fallback badges for room ${roomNumber}`);
        
        // Get badges for this room
        const roomBadges = this.fallbackBadges[roomNumber] || [];
        
        // Check which badges should be awarded based on completion
        const newBadges = [];
        
        // Always award the main completion badge
        if (roomBadges.length > 0) {
            newBadges.push(roomBadges[0]); // Main badge
        }
        
        // Award additional badges based on performance
        if (completionData.score >= 100 && roomBadges.length > 1) {
            newBadges.push(roomBadges[1]); // Performance badge
        }
        
        // Award special badges based on specific criteria
        if (roomBadges.length > 2) {
            const specialCriteria = this.checkSpecialCriteria(roomNumber, completionData);
            if (specialCriteria) {
                newBadges.push(roomBadges[2]); // Special badge
            }
        }
        
        // Store in local storage to prevent re-awarding
        this.storeBadgesLocally(newBadges);
        
        if (newBadges.length > 0) {
            this.recentlyEarnedBadges = newBadges;
            await this.showBadgeRewards(newBadges);
            return newBadges;
        }
        
        return [];
    }

    checkSpecialCriteria(roomNumber, completionData) {
        switch (roomNumber) {
            case 1: // Flowchart Lab
                return completionData.timeSpent < 180000; // Under 3 minutes
            case 2: // Network Nexus
                return completionData.levelsCompleted >= 5; // All levels completed
            case 3: // AI Systems
                return completionData.ethicalUnderstanding >= 90; // High ethical score
            case 4: // Database Crisis
                return completionData.queryTime < 100; // Fast query optimization
            case 5: // Programming Crisis
                return completionData.bugsFixed >= 5; // Fixed multiple bugs
            default:
                return completionData.score >= 95; // High score fallback
        }
    }

    storeBadgesLocally(badges) {
        const stored = JSON.parse(localStorage.getItem('earned_badges') || '[]');
        
        badges.forEach(badge => {
            if (!stored.find(b => b.id === badge.id)) {
                stored.push({
                    ...badge,
                    earned_at: new Date().toISOString(),
                    earned: true
                });
            }
        });
        
        localStorage.setItem('earned_badges', JSON.stringify(stored));
    }

    getStoredBadges() {
        return JSON.parse(localStorage.getItem('earned_badges') || '[]');
    }

    async showBadgeRewards(badges) {
        if (!badges || badges.length === 0) return;

        console.log('Showing badge rewards:', badges);

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        modal.id = 'badge-reward-modal';

        modal.innerHTML = `
            <div class="bg-gradient-to-br from-yellow-900 to-orange-900 border-2 border-yellow-500 rounded-lg p-8 max-w-2xl w-full text-center animate-pulse">
                <div class="mb-6">
                    <i class="bi bi-award-fill text-8xl text-yellow-400 animate-bounce"></i>
                    <h2 class="text-3xl font-bold text-yellow-300 mt-4 mb-2">🎉 BADGE${badges.length > 1 ? 'S' : ''} EARNED! 🎉</h2>
                    <p class="text-yellow-200">Congratulations! You've unlocked new achievement${badges.length > 1 ? 's' : ''}!</p>
                </div>

                <div class="badges-display grid ${badges.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-6">
                    ${badges.map(badge => this.createBadgeRewardCard(badge)).join('')}
                </div>

                <div class="reward-actions flex flex-col sm:flex-row gap-3 justify-center">
                    <button id="view-all-badges" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105">
                        <i class="bi bi-collection mr-2"></i>View All Badges
                    </button>
                    <button id="continue-playing" class="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105">
                        <i class="bi bi-play-fill mr-2"></i>Continue Adventure
                    </button>
                </div>

                <div class="badge-celebration mt-4">
                    <div class="text-yellow-300 text-sm">
                        ${this.getBadgeCelebrationMessage(badges)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add celebration effects
        this.addCelebrationEffects();

        // Set up event listeners
        document.getElementById('view-all-badges').addEventListener('click', () => {
            modal.remove();
            this.game.showBadgesMenu();
        });

        document.getElementById('continue-playing').addEventListener('click', () => {
            modal.remove();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    createBadgeRewardCard(badge) {
        const roomColors = {
            1: 'blue',
            2: 'green', 
            3: 'purple',
            4: 'red',
            5: 'yellow',
            0: 'gray'
        };
        
        const color = roomColors[badge.room_id] || 'gray';
        
        return `
            <div class="badge-reward-card bg-${color}-800 border-2 border-${color}-400 rounded-lg p-4 transform hover:scale-105 transition-all">
                <div class="badge-icon text-5xl mb-3">
                    ${badge.icon || this.getDefaultBadgeIcon(badge.room_id)}
                </div>
                <h3 class="text-xl font-bold text-${color}-200 mb-2">${badge.name}</h3>
                <p class="text-${color}-300 text-sm mb-3">${badge.description}</p>
                <div class="badge-room text-xs text-${color}-400">
                    ${this.getRoomName(badge.room_id)}
                </div>
                <div class="earned-timestamp text-xs text-gray-400 mt-2">
                    Earned: ${new Date().toLocaleDateString()}
                </div>
            </div>
        `;
    }

    getDefaultBadgeIcon(roomId) {
        const icons = {
            1: '📊', // Flowchart Lab
            2: '🌐', // Network Nexus
            3: '🤖', // AI Systems
            4: '🗄️', // Database Crisis
            5: '🐛', // Programming Crisis
            0: '⭐'  // General
        };
        return icons[roomId] || '🏆';
    }

    getRoomName(roomId) {
        const names = {
            1: 'Flowchart Lab',
            2: 'Network Nexus', 
            3: 'AI Systems',
            4: 'Database Crisis',
            5: 'Programming Crisis',
            0: 'General Achievement'
        };
        return names[roomId] || 'Achievement';
    }

    getBadgeCelebrationMessage(badges) {
        const messages = [
            "Outstanding work! Your skills are truly impressive! 🌟",
            "You're becoming a tech legend! Keep up the amazing progress! 🚀",
            "Incredible achievement! You've mastered another challenge! 💫",
            "Fantastic! Your dedication to learning is paying off! 🎯",
            "Brilliant work! You're well on your way to escaping the lab! ⚡"
        ];
        
        if (badges.length > 1) {
            return "Multiple badges in one go? You're on fire! 🔥";
        }
        
        return messages[Math.floor(Math.random() * messages.length)];
    }

    addCelebrationEffects() {
        // Add floating particles effect
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed pointer-events-none z-40';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = window.innerHeight + 'px';
            particle.style.fontSize = '20px';
            particle.textContent = ['⭐', '🎉', '💫', '✨'][Math.floor(Math.random() * 4)];
            
            document.body.appendChild(particle);
            
            // Animate particle upward
            const animation = particle.animate([
                { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
                { transform: `translateY(-${window.innerHeight + 100}px) rotate(360deg)`, opacity: 0 }
            ], {
                duration: 3000 + Math.random() * 2000,
                easing: 'ease-out'
            });
            
            animation.onfinish = () => particle.remove();
        }
    }

    // Method to check specific badge requirements
    checkSpecificBadgeRequirements(roomNumber, completionData) {
        const requirements = {
            // Speed-based badges
            speed: completionData.timeSpent < 120000, // 2 minutes in milliseconds
            // Performance-based badges  
            perfect: completionData.score >= 100,
            // Efficiency badges
            noHints: completionData.hintsUsed === 0,
            // Completion badges
            firstTime: completionData.isFirstCompletion,
        };
        
        return requirements;
    }
}
