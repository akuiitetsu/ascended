class Room6 {
    constructor(game) {
        this.game = game;
        this.completionScore = 0;
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.isActive = false;
        this.linesOfCode = 0;
        this.bugsFixed = 0;
        this.testsWritten = 0;
    }

    async init() {
        console.log('Room 6 (Programming) initializing...');
        this.render();
        this.setupGame();
    }

    render() {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div class="room-container p-6 fade-in">
                <div class="text-center mb-6">
                    <i class="bi bi-code text-6xl text-pink-500 animate-pulse"></i>
                    <h2 class="text-3xl font-bold mt-4 text-pink-400">PROGRAMMING CHALLENGE</h2>
                    <p class="text-gray-300 mt-2">Write clean code and fix bugs efficiently!</p>
                </div>
                
                <div class="status-grid grid grid-cols-3 gap-4 mb-6">
                    <div class="status-card bg-pink-900 p-4 rounded text-center">
                        <i class="bi bi-file-code text-pink-400 text-2xl"></i>
                        <p class="text-sm text-pink-200">Lines of Code</p>
                        <p id="lines-of-code" class="text-2xl font-bold text-pink-100">${this.linesOfCode}</p>
                        <p class="text-xs text-pink-300">Written</p>
                    </div>
                    <div class="status-card bg-red-900 p-4 rounded text-center">
                        <i class="bi bi-bug text-red-400 text-2xl"></i>
                        <p class="text-sm text-red-200">Bugs Fixed</p>
                        <p id="bugs-fixed" class="text-2xl font-bold text-red-100">${this.bugsFixed}</p>
                        <p class="text-xs text-red-300">Resolved</p>
                    </div>
                    <div class="status-card bg-green-900 p-4 rounded text-center">
                        <i class="bi bi-check-circle text-green-400 text-2xl"></i>
                        <p class="text-sm text-green-200">Code Quality</p>
                        <p id="code-quality" class="text-2xl font-bold text-green-100">${Math.round(this.completionScore)}%</p>
                        <p class="text-xs text-green-300">Excellence</p>
                    </div>
                </div>

                <div class="game-area bg-gray-800 p-6 rounded-lg">
                    <div id="programming-game" class="relative bg-gray-900 rounded" style="height: 400px; border: 2px solid #ec4899;">
                        <div class="text-center text-white p-8">
                            <h3 class="text-xl mb-4">Code Editor</h3>
                            <p class="mb-4">Click "Start Coding" to begin your programming challenge!</p>
                        </div>
                    </div>
                    
                    <div class="controls mt-4 text-center">
                        <button id="start-coding" class="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-play-fill"></i> Start Coding
                        </button>
                        <button id="write-code" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-pencil"></i> Write Code
                        </button>
                        <button id="fix-bug" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-bug"></i> Fix Bug
                        </button>
                        <button id="write-test" class="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-check-square"></i> Write Test
                        </button>
                        <button id="complete-room" class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded mr-2">
                            <i class="bi bi-check-circle"></i> Complete
                        </button>
                        <button id="exit-room" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded">
                            <i class="bi bi-x-circle"></i> Exit
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const startBtn = document.getElementById('start-coding');
        const writeBtn = document.getElementById('write-code');
        const fixBtn = document.getElementById('fix-bug');
        const testBtn = document.getElementById('write-test');
        const completeBtn = document.getElementById('complete-room');
        const exitBtn = document.getElementById('exit-room');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCoding());
        }
        if (writeBtn) {
            writeBtn.addEventListener('click', () => this.writeCode());
        }
        if (fixBtn) {
            fixBtn.addEventListener('click', () => this.fixBug());
        }
        if (testBtn) {
            testBtn.addEventListener('click', () => this.writeTest());
        }
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.completeRoom());
        }
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.exitRoom());
        }
    }

    setupGame() {
        console.log('Programming challenge setup complete');
    }

    startCoding() {
        this.isActive = true;
        this.updateDisplay();
        console.log('Programming challenge started');
    }

    writeCode() {
        if (this.isActive) {
            this.linesOfCode += Math.floor(Math.random() * 20) + 5;
            this.completionScore += 8;
            this.updateDisplay();
        }
    }

    fixBug() {
        if (this.isActive) {
            this.bugsFixed++;
            this.completionScore += 15;
            this.updateDisplay();
        }
    }

    writeTest() {
        if (this.isActive) {
            this.testsWritten++;
            this.completionScore += 12;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        const linesElement = document.getElementById('lines-of-code');
        const bugsElement = document.getElementById('bugs-fixed');
        const qualityElement = document.getElementById('code-quality');

        if (linesElement) {
            linesElement.textContent = this.linesOfCode.toString();
        }
        if (bugsElement) {
            bugsElement.textContent = this.bugsFixed.toString();
        }
        if (qualityElement) {
            qualityElement.textContent = `${Math.round(this.completionScore)}%`;
        }
    }

    completeRoom() {
        this.isActive = false;
        
        // Enhanced completion data for badge system
        const completionData = {
            score: Math.round(this.completionScore),
            timeSpent: Date.now() - (this.startTime || Date.now()),
            hintsUsed: 0,
            linesOfCode: this.linesOfCode,
            bugsFixed: this.bugsFixed,
            testsWritten: this.testsWritten,
            programmingSkills: true,
            attempts: 1
        };
        
        const message = `Programming challenge completed! Code quality: ${Math.round(this.completionScore)}%`;
        this.game.roomCompleted(message, completionData);
    }

    exitRoom() {
        this.cleanup();
        this.game.gameOver('Programming session ended.');
    }

    cleanup() {
        this.isActive = false;
        console.log('Room 6 cleaned up');
    }
}

// Register globally and export
window.Room6 = Room6;
export { Room6 as Room1 };
