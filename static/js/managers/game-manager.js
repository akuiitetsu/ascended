export class GameManager {
    constructor(game) {
        this.game = game;
    }

    startGame() {
        this.game.gameActive = true;
        this.game.gameStarted = true;
        
        this.game.levelManager.loadRoom(1);
    }

    roomCompleted(message) {
        // On first room completion, initialize badges if not present
        if (!Array.isArray(this.game.player.unlockedCosmetics)) {
            this.game.player.unlockedCosmetics = [];
        }
        this.game.player.roomsCompleted++;
        this.game.cosmeticManager.unlockCosmetics();
        
        if (this.game.currentRoom === this.game.totalRooms) {
            this.gameWon();
        } else {
            this.game.modalManager.showSuccessModal(message);
        }
    }

    nextRoom() {
        this.game.modalManager.hideSuccessModal();
        this.game.levelManager.stopCurrentRoom();
        this.game.levelManager.loadRoom(this.game.currentRoom + 1);
    }

    pauseGame(reason) {
        this.game.modalManager.showPauseOverlay(reason);
    }

    resumeGame() {
        this.game.modalManager.hidePauseOverlay();
    }

    gameWon() {
        this.game.gameActive = false;
        
        document.getElementById('room-content').innerHTML = this.game.modalManager.showVictoryContent();
        
        this.game.player.level++;
        this.game.cosmeticManager.savePlayerData();
    }

    gameOver(message) {
        this.game.gameActive = false;
        
        this.game.modalManager.showGameOverModal(message);
    }

    restartGame() {
        this.game.levelManager.stopCurrentRoom();
        window.location.reload();
    }

    enableFullscreen() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.enableFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}