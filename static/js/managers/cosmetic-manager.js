export class CosmeticManager {
    constructor(game) {
        this.game = game;
    }

    unlockCosmetics() {
        const roomsCompleted = this.game.player.roomsCompleted;
        const badgeMap = {
            1: { name: 'Network Security Badge', id: 'network-badge' },
            2: { name: 'Cloud Engineer Badge', id: 'cloud-badge' },
            3: { name: 'AI Specialist Badge', id: 'ai-badge' },
            4: { name: 'Database Engineer Badge', id: 'database-badge' },
            5: { name: 'Programming Badge', id: 'programming-badge' }
        };
        const badge = badgeMap[roomsCompleted];
        if (badge && !this.game.player.unlockedCosmetics.includes(badge.id)) {
            this.game.player.unlockedCosmetics.push(badge.id);
            this.showCosmeticUnlocks([badge.name]);
        }
    }

    showCosmeticUnlocks(newUnlocks) {
        const unlockModal = document.createElement('div');
        unlockModal.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
        unlockModal.innerHTML = `
            <div class="bg-gradient-to-br from-purple-900 to-blue-900 border-2 border-purple-500 p-6 rounded-lg max-w-md text-center">
                <i class="bi bi-star-fill text-6xl text-yellow-400 mb-4 animate-pulse"></i>
                <h3 class="text-2xl font-bold text-purple-200 mb-4">COSMETICS UNLOCKED!</h3>
                <div class="text-purple-100 mb-4">
                    <p class="mb-2">🎉 New equipment available:</p>
                    <ul class="list-disc list-inside space-y-1">
                        ${newUnlocks.map(item => `<li class="text-yellow-300">${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="flex gap-3 justify-center">
                    <button id="view-cosmetics" class="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded font-bold">
                        View Equipment
                    </button>
                    <button id="continue-mission" class="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded font-bold">
                        Continue Mission
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(unlockModal);
        
        document.getElementById('view-cosmetics').addEventListener('click', () => {
            unlockModal.remove();
            this.showCosmeticMenu();
        });
        
        document.getElementById('continue-mission').addEventListener('click', () => {
            unlockModal.remove();
        });
    }

    renderCharacter() {
        const { suit, helmet, gloves, badge, weapon } = this.game.player.cosmetics;
        
        // Character visual representation for tech theme
        const suitIcons = {
            basic: '💻',
            cyber: '🔒',
            cloud: '☁️',
            ai: '🤖',
            data: '💾',
            hacker: '🕶️',
            developer: '👨‍💻'
        };
        
        const helmetIcons = {
            none: '',
            'neural-helmet': '🧠',
            'crypto-helmet': '🔐',
            'code-helmet': '💭'
        };
        
        const badgeIcons = {
            none: '',
            network: '🌐',
            devops: '🔄',
            ai: '🤖',
            data: '💾',
            security: '🔒',
            programming: '💻'
        };
        
        const weaponIcons = {
            none: '',
            'security-tablet': '📋',
            'monitoring-device': '📊',
            'quantum-scanner': '🔮',
            'sql-tablet': '💽',
            'penetration-kit': '🛠️',
            'debug-scanner': '🐛'
        };
        
        return `
            <div class="character-avatar-display text-center bg-gray-800 p-6 rounded-lg">
                <div class="character-visual text-8xl mb-4">
                    <div class="relative inline-block">
                        ${suitIcons[suit] || '💻'}
                        ${helmet !== 'none' ? `<div class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">${helmetIcons[helmet]}</div>` : ''}
                    </div>
                </div>
                <div class="character-accessories flex justify-center gap-2 text-2xl">
                    ${badge !== 'none' ? badgeIcons[badge] : ''}
                    ${weapon !== 'none' ? weaponIcons[weapon] : ''}
                </div>
                <div class="character-name mt-2">
                    <p class="text-lg font-bold text-green-400">${this.game.player.name}</p>
                    <p class="text-sm text-gray-400">Technology Emergency Specialist</p>
                </div>
            </div>
        `;
    }

    showCosmeticMenu() {
        const cosmeticModal = document.createElement('div');
        cosmeticModal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
        // Only show badges (badge progress) in the cosmetic menu
        const badgeList = this.getCosmeticsByCategory('badge').filter(b => b.id !== 'none');
        const unlocked = this.game.player.unlockedCosmetics || [];
        const badgeProgress = `
            <div class="badge-progress bg-gray-900 border-2 border-purple-700 rounded-lg p-4 mb-6">
                <h3 class="text-lg font-bold text-purple-300 mb-3 flex items-center"><i class="bi bi-award mr-2"></i>Badge Progress</h3>
                <div class="flex flex-wrap gap-4 justify-center">
                    ${badgeList.map(badge => {
                        const isUnlocked = unlocked.includes(badge.id);
                        return `
                            <div class="flex flex-col items-center">
                                <div class="text-3xl ${isUnlocked ? 'text-yellow-300' : 'text-gray-600'}">${badge.icon}</div>
                                <span class="text-xs font-bold ${isUnlocked ? 'text-yellow-200' : 'text-gray-500'}">${badge.name}</span>
                                ${isUnlocked ? '<span class="text-green-400 text-xs mt-1">Unlocked</span>' : '<span class="text-gray-400 text-xs mt-1">Locked</span>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        cosmeticModal.innerHTML = `
            <div class="bg-gray-800 border-2 border-gray-600 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-3xl font-bold text-purple-400">🎽 AGENT CUSTOMIZATION</h2>
                        <button id="close-cosmetics" class="text-gray-400 hover:text-white text-2xl">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                    ${badgeProgress}
                </div>
            </div>
        `;
        document.body.appendChild(cosmeticModal);
        document.getElementById('close-cosmetics').addEventListener('click', () => {
            cosmeticModal.remove();
        });
    }

    renderCosmeticOptions(category) {
        const cosmetics = this.getCosmeticsByCategory(category);
        
        return cosmetics.map(item => {
            const isUnlocked = this.game.player.unlockedCosmetics.includes(item.id);
            const isSelected = this.game.player.cosmetics[category] === item.value;
            
            return `
                <button class="cosmetic-item p-2 rounded border-2 transition-colors ${
                    isSelected ? 'border-blue-400 bg-blue-800' : 
                    isUnlocked ? 'border-gray-500 bg-gray-700 hover:border-gray-300' : 
                    'border-red-500 bg-red-900 opacity-50'
                }" 
                data-category="${category}" 
                data-value="${item.value}"
                ${!isUnlocked ? 'disabled' : ''}>
                    <div class="text-center">
                        <div class="text-2xl mb-1">${item.icon}</div>
                        <div class="text-xs font-bold">${item.name}</div>
                        ${!isUnlocked ? '<div class="text-red-400 text-xs">🔒 Locked</div>' : ''}
                        ${isSelected ? '<div class="text-blue-400 text-xs">✓ Equipped</div>' : ''}
                    </div>
                </button>
            `;
        }).join('');
    }

    getCosmeticsByCategory(category) {
        const cosmetics = {
            suit: [
                { id: 'basic-suit', value: 'basic', name: 'Basic Tech Suit', icon: '💻' },
                { id: 'cyber-suit', value: 'cyber', name: 'Cyber Security Suit', icon: '🔒' },
                { id: 'cloud-suit', value: 'cloud', name: 'Cloud Engineer Suit', icon: '☁️' },
                { id: 'ai-suit', value: 'ai', name: 'AI Specialist Suit', icon: '🤖' },
                { id: 'data-suit', value: 'data', name: 'Data Engineer Suit', icon: '💾' },
                { id: 'hacker-suit', value: 'hacker', name: 'Ethical Hacker Suit', icon: '🕶️' },
                { id: 'developer-suit', value: 'developer', name: 'Master Developer Suit', icon: '👨‍💻' }
            ],
            helmet: [
                { id: 'none', value: 'none', name: 'None', icon: '👤' },
                { id: 'neural-helmet', value: 'neural-helmet', name: 'Neural Interface', icon: '🧠' },
                { id: 'crypto-helmet', value: 'crypto-helmet', name: 'Crypto Helmet', icon: '🔐' },
                { id: 'code-helmet', value: 'code-helmet', name: 'Code Helmet', icon: '💭' }
            ],
            gloves: [
                { id: 'basic-gloves', value: 'basic', name: 'Basic Tech Gloves', icon: '🧤' },
                { id: 'cyber-gloves', value: 'cyber', name: 'Cyber Gloves', icon: '⌨️' },
                { id: 'data-gloves', value: 'data', name: 'Data Gloves', icon: '📊' }
            ],
            badge: [
                { id: 'none', value: 'none', name: 'None', icon: '⚪' },
                { id: 'network-badge', value: 'network', name: 'Network Badge', icon: '🌐' },
                { id: 'devops-badge', value: 'devops', name: 'DevOps Badge', icon: '🔄' },
                { id: 'ai-badge', value: 'ai', name: 'AI Badge', icon: '🤖' },
                { id: 'data-badge', value: 'data', name: 'Database Badge', icon: '💾' },
                { id: 'security-badge', value: 'security', name: 'Security Badge', icon: '🔒' },
                { id: 'programming-badge', value: 'programming', name: 'Programming Badge', icon: '💻' }
            ],
            weapon: [
                { id: 'none', value: 'none', name: 'None', icon: '⚪' },
                { id: 'security-tablet', value: 'security-tablet', name: 'Security Tablet', icon: '📋' },
                { id: 'monitoring-device', value: 'monitoring-device', name: 'Monitoring Device', icon: '📊' },
                { id: 'quantum-scanner', value: 'quantum-scanner', name: 'Quantum Scanner', icon: '🔮' },
                { id: 'sql-tablet', value: 'sql-tablet', name: 'SQL Tablet', icon: '💽' },
                { id: 'penetration-kit', value: 'penetration-kit', name: 'Penetration Kit', icon: '🛠️' },
                { id: 'debug-scanner', value: 'debug-scanner', name: 'Debug Scanner', icon: '🐛' }
            ]
        };
        
        return cosmetics[category] || [];
    }

    equipCosmetic(category, itemValue) {
        this.game.player.cosmetics[category] = itemValue;
        localStorage.setItem('player-cosmetics', JSON.stringify(this.game.player.cosmetics));
    }

    updateCharacterPreview() {
        const characterDisplay = document.getElementById('character-display');
        if (characterDisplay) {
            characterDisplay.innerHTML = this.renderCharacter();
        }
    }

    updateCosmeticSelection(modal) {
        // Update button states
        modal.querySelectorAll('.cosmetic-item').forEach(item => {
            const category = item.dataset.category;
            const value = item.dataset.value;
            const isSelected = this.game.player.cosmetics[category] === value;
            
            // Remove existing selection classes
            item.classList.remove('border-blue-400', 'bg-blue-800', 'border-gray-500', 'bg-gray-700');
            
            if (isSelected) {
                item.classList.add('border-blue-400', 'bg-blue-800');
                item.querySelector('.text-xs:last-child')?.remove();
                const selectedDiv = document.createElement('div');
                selectedDiv.className = 'text-blue-400 text-xs';
                selectedDiv.textContent = '✓ Equipped';
                item.appendChild(selectedDiv);
            } else if (!item.disabled) {
                item.classList.add('border-gray-500', 'bg-gray-700');
            }
        });
    }

    loadPlayerData() {
        const savedCosmetics = localStorage.getItem('player-cosmetics');
        if (savedCosmetics) {
            this.game.player.cosmetics = { ...this.game.player.cosmetics, ...JSON.parse(savedCosmetics) };
        }
        
        const savedProgress = localStorage.getItem('player-progress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            this.game.player.roomsCompleted = progress.roomsCompleted || 0;
            this.game.player.unlockedCosmetics = progress.unlockedCosmetics || ['basic-suit', 'basic-gloves'];
        }
    }

    savePlayerData() {
        localStorage.setItem('player-cosmetics', JSON.stringify(this.game.player.cosmetics));
        localStorage.setItem('player-progress', JSON.stringify({
            roomsCompleted: this.game.player.roomsCompleted,
            unlockedCosmetics: this.game.player.unlockedCosmetics
        }));
    }
}
