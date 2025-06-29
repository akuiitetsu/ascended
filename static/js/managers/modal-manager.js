export class ModalManager {
    constructor(game) {
        this.game = game;
    }

    showSuccessModal(message) {
        document.getElementById('success-message').textContent = message;
        
        // Add cosmetic button to success modal
        const successModal = document.getElementById('success-modal');
        const existingButton = successModal.querySelector('#customize-character');
        if (!existingButton) {
            const nextButton = document.getElementById('next-room-btn');
            const customizeButton = document.createElement('button');
            customizeButton.id = 'customize-character';
            customizeButton.className = 'bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded mr-3';
            customizeButton.innerHTML = '<i class="bi bi-person-gear"></i> Customize';
            customizeButton.addEventListener('click', () => this.game.cosmeticManager.showCosmeticMenu());
            nextButton.parentNode.insertBefore(customizeButton, nextButton);
        }
        
        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
    }

    hideSuccessModal() {
        const successModal = document.getElementById('success-modal');
        successModal.classList.add('hidden');
        successModal.classList.remove('flex');
    }

    showGameOverModal(message) {
        document.getElementById('failure-message').textContent = message;
        document.getElementById('gameover-modal').classList.remove('hidden');
        document.getElementById('gameover-modal').classList.add('flex');
    }

    showPauseOverlay(reason) {
        let overlay = document.getElementById('pause-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pause-overlay';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
            overlay.innerHTML = `
                <div class="text-center">
                    <i class="bi bi-pause-circle text-8xl text-yellow-400 mb-4 animate-pulse"></i>
                    <h2 class="text-3xl font-bold text-yellow-400 mb-4">GAME PAUSED</h2>
                    <p id="pause-reason" class="text-gray-300 mb-6"></p>
                    <p class="text-gray-400 text-sm">Return to this tab to continue...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        document.getElementById('pause-reason').textContent = reason;
        overlay.style.display = 'flex';
    }

    hidePauseOverlay() {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showNavigationWarning() {
        const warning = document.createElement('div');
        warning.className = 'fixed top-4 right-4 bg-red-800 border border-red-500 p-4 rounded-lg z-50 animate-pulse';
        warning.innerHTML = `
            <div class="flex items-center">
                <i class="bi bi-exclamation-triangle text-red-400 mr-2"></i>
                <span class="text-red-100 text-sm">Navigation restricted during active mission!</span>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.remove();
        }, 3000);
    }

    showVictoryContent() {
        // Remove time-related display
        return `
            <div class="victory text-center">
                <i class="bi bi-trophy-fill text-8xl text-yellow-400 mb-6"></i>
                <h2 class="text-4xl font-bold text-green-400 mb-4">MISSION ACCOMPLISHED!</h2>
                
                <div class="victory-character mb-6">
                    ${this.game.cosmeticManager.renderCharacter()}
                </div>
                
                <p class="text-xl mb-4">You've successfully escaped the lab!</p>
                
                <div class="victory-stats bg-gray-800 p-4 rounded-lg mb-6 max-w-md mx-auto">
                    <h3 class="text-lg font-bold text-purple-400 mb-2">🏆 Mission Statistics</h3>
                    <p class="text-gray-300">Rooms Completed: <span class="text-green-400">${this.game.player.roomsCompleted}/${this.game.totalRooms}</span></p>
                    <p class="text-gray-300">Equipment Unlocked: <span class="text-purple-400">${this.game.player.unlockedCosmetics.length}</span></p>
                    <p class="text-gray-300">Agent Level: <span class="text-yellow-400">${this.game.player.level}</span></p>
                </div>
                
                <div class="flex gap-4 justify-center">
                    <button onclick="location.reload()" class="bg-green-600 hover:bg-green-700 px-8 py-3 rounded text-lg">
                        New Mission
                    </button>
                    <button onclick="game.cosmeticManager.showCosmeticMenu()" class="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded text-lg">
                        <i class="bi bi-person-gear"></i> View Equipment
                    </button>
                </div>
            </div>
        `;
    }
}