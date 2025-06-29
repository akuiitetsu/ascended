export class LevelTester {
    constructor(editor) {
        this.editor = editor;
        this.testModeActive = false;
    }

    testLevel() {
        if (this.editor.currentEditingLevel.bugs.length === 0) {
            this.editor.showMessage('Add at least one bug to test the level!', 'error');
            return;
        }
        
        // Apply the custom level to the room
        this.editor.room.bugs = [...this.editor.currentEditingLevel.bugs];
        this.editor.room.obstacles = [...this.editor.currentEditingLevel.obstacles];
        this.editor.room.powerUps = [...this.editor.currentEditingLevel.powerUps];
        this.editor.room.player.x = this.editor.currentEditingLevel.playerStart.x;
        this.editor.room.player.y = this.editor.currentEditingLevel.playerStart.y;
        this.editor.room.player.health = 100;
        this.editor.room.player.energy = 50;
        this.editor.room.player.inventory = [];
        this.editor.room.bugsDefeated = 0;
        // Remove timer reset - this.editor.room.timeRemaining = 600;
        
        // Exit editor and start test
        this.editor.isEditorMode = false;
        this.testModeActive = true;
        
        this.editor.room.render();
        this.editor.room.gridManager.setupGameGrid();
        // Remove startTimer() call - this.editor.room.startTimer();
        
        // Add test mode UI elements
        this.addTestModeUI();
        
        this.editor.showMessage('🧪 TEST MODE ACTIVE - Press ESC or click Exit to return to editor', 'info');
    }

    addTestModeUI() {
        // Add test mode indicator
        const testIndicator = document.createElement('div');
        testIndicator.id = 'test-mode-indicator';
        testIndicator.className = 'fixed top-4 left-4 bg-yellow-600 text-white p-3 rounded-lg z-50 shadow-lg';
        testIndicator.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="bi bi-flask text-xl"></i>
                <div>
                    <div class="font-bold">TEST MODE</div>
                    <div class="text-xs">Testing custom level</div>
                </div>
            </div>
        `;
        document.body.appendChild(testIndicator);
        
        // Add exit test mode button
        const exitButton = document.createElement('button');
        exitButton.id = 'exit-test-mode';
        exitButton.className = 'fixed top-4 right-4 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg z-50 transition-colors';
        exitButton.innerHTML = '<i class="bi bi-x-circle"></i> Exit Test Mode';
        exitButton.addEventListener('click', () => this.exitTestMode());
        document.body.appendChild(exitButton);
        
        // Add keyboard shortcut for exiting test mode
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && this.testModeActive) {
                this.exitTestMode();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        // Override room completion methods for test mode
        this.originalLevelComplete = this.editor.room.levelComplete;
        this.originalGameOver = this.editor.room.gameOver;
        this.originalSystemStabilized = this.editor.room.systemStabilized;
        
        this.editor.room.levelComplete = () => {
            this.editor.showMessage('✅ Level test completed successfully! All bugs eliminated.', 'success');
            setTimeout(() => this.exitTestMode(), 2000);
        };
        
        this.editor.room.gameOver = () => {
            this.editor.showMessage('❌ Level test failed! Player health depleted.', 'error');
            setTimeout(() => this.exitTestMode(), 2000);
        };
        
        this.editor.room.systemStabilized = () => {
            this.editor.showMessage('🎉 Level test completed! System stabilized.', 'success');
            setTimeout(() => this.exitTestMode(), 2000);
        };
    }

    exitTestMode() {
        if (!this.testModeActive) return;
        
        this.testModeActive = false;
        
        // Clean up test mode UI
        const testIndicator = document.getElementById('test-mode-indicator');
        const exitButton = document.getElementById('exit-test-mode');
        
        if (testIndicator) testIndicator.remove();
        if (exitButton) exitButton.remove();
        
        // Remove escape key handler
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        
        // Remove timer stop - Stop the room's timer
        // if (this.editor.room.programmingTimer) {
        //     clearInterval(this.editor.room.programmingTimer);
        // }
        
        // Stop code execution
        if (this.editor.room.codeExecutor) {
            this.editor.room.codeExecutor.stopExecution();
        }
        
        // Restore original room methods
        if (this.originalLevelComplete) {
            this.editor.room.levelComplete = this.originalLevelComplete;
        }
        if (this.originalGameOver) {
            this.editor.room.gameOver = this.originalGameOver;
        }
        if (this.originalSystemStabilized) {
            this.editor.room.systemStabilized = this.originalSystemStabilized;
        }
        
        // Return to editor mode
        this.editor.enterEditorMode();
        
        this.editor.showMessage('Returned to level editor', 'info');
    }

    isTestModeActive() {
        return this.testModeActive;
    }
}
