export class VerificationManager {
    constructor(room) {
        this.room = room;
        this.completedTests = [];
        this.testResults = {};
    }

    renderVerificationStep() {
        return `
            <div class="verification-step">
                <h3 class="text-xl font-bold text-green-400 mb-4">✅ Data Verification</h3>
                <p class="text-gray-300 mb-4">Run verification tests to ensure data integrity</p>
                
                <div class="verification-grid grid grid-cols-2 gap-4">
                    ${this.room.data.verification_tests.map(test => `
                        <div class="test-card bg-gray-800 p-4 rounded border-2 ${this.getTestCardClass(test.id)}">
                            <div class="test-header flex items-center justify-between mb-3">
                                <h5 class="font-bold text-white flex items-center">
                                    <span class="text-2xl mr-2">${test.icon}</span>
                                    ${test.name}
                                </h5>
                                <div class="test-status">
                                    ${this.getTestStatusIcon(test.id)}
                                </div>
                            </div>
                            
                            <div class="test-description text-sm text-gray-300 mb-3">
                                ${test.description}
                            </div>
                            
                            <div class="test-details grid grid-cols-2 gap-2 text-xs mb-3">
                                <div class="text-blue-300">Expected: <span class="text-white">${test.expected_result}</span></div>
                                <div class="text-purple-300">Severity: <span class="text-white">${test.severity}</span></div>
                            </div>
                            
                            <div class="test-controls">
                                <button class="run-test w-full py-2 px-4 rounded transition-colors ${this.getTestButtonClass(test.id)}" 
                                        data-test="${test.id}" 
                                        ${this.completedTests.includes(test.id) ? 'disabled' : ''}>
                                    ${this.getTestButtonText(test.id)}
                                </button>
                            </div>
                            
                            ${this.renderTestResult(test.id)}
                        </div>
                    `).join('')}
                </div>
                
                <div class="verification-progress bg-gray-800 p-4 rounded mt-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-300">Verification Progress:</span>
                        <span class="text-green-400 font-mono">${this.completedTests.length}/${this.room.data.verification_tests.length} tests completed</span>
                    </div>
                    
                    <div class="w-full bg-gray-600 rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full transition-all duration-300" 
                             style="width: ${(this.completedTests.length / this.room.data.verification_tests.length) * 100}%"></div>
                    </div>
                    
                    <div class="verification-summary mt-3 text-sm">
                        <div class="grid grid-cols-3 gap-4">
                            <div class="text-green-300">
                                Passed: <span class="text-white font-bold">${this.getPassedTests()}</span>
                            </div>
                            <div class="text-red-300">
                                Failed: <span class="text-white font-bold">${this.getFailedTests()}</span>
                            </div>
                            <div class="text-blue-300">
                                Overall: <span class="text-white font-bold">${this.getOverallScore()}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="control-center text-center mt-4">
                    <button id="complete-verification" 
                            class="bg-green-600 hover:bg-green-500 px-8 py-3 rounded transition-colors text-lg font-bold"
                            ${this.completedTests.length < this.room.data.verification_tests.length ? 'disabled' : ''}>
                        <i class="bi bi-check-circle"></i> Complete Database Recovery
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        document.querySelectorAll('.run-test').forEach(btn => {
            btn.addEventListener('click', () => {
                this.runVerificationTest(btn.dataset.test);
            });
        });

        document.getElementById('complete-verification')?.addEventListener('click', () => {
            this.completeVerification();
        });
    }

    runVerificationTest(testId) {
        if (this.completedTests.includes(testId)) return;

        const test = this.room.data.verification_tests.find(t => t.id === testId);
        if (!test) return;

        // Show running state
        this.showTestRunning(testId);

        // Simulate test execution
        setTimeout(() => {
            const success = this.executeTest(test);
            this.testResults[testId] = {
                success,
                timestamp: new Date().toISOString(),
                details: this.generateTestDetails(test, success)
            };
            
            this.completedTests.push(testId);
            
            if (success) {
                this.room.dataIntegrity = Math.min(100, this.room.dataIntegrity + 5);
            }
            
            this.room.updateStatusDisplays();
            this.room.render();
            
            // Check if all tests completed
            if (this.completedTests.length >= this.room.data.verification_tests.length) {
                setTimeout(() => {
                    if (this.getOverallScore() >= 75) {
                        this.room.databaseRecovered();
                    }
                }, 1000);
            }
        }, 2000 + Math.random() * 2000); // 2-4 seconds
    }

    executeTest(test) {
        // Simulate test success based on table recovery status
        const recoveryRate = this.room.recoveredTables / 8;
        const baseSuccessRate = recoveryRate * 0.8 + 0.2; // 20-100% based on recovery
        
        // Add some randomness but bias towards success if tables are recovered
        const randomFactor = Math.random();
        return randomFactor < baseSuccessRate;
    }

    generateTestDetails(test, success) {
        if (success) {
            return {
                status: 'PASSED',
                message: `${test.name} completed successfully`,
                metrics: {
                    'Execution Time': `${(Math.random() * 2 + 0.5).toFixed(2)}s`,
                    'Data Validation': 'PASSED',
                    'Integrity Check': 'PASSED'
                }
            };
        } else {
            return {
                status: 'FAILED',
                message: `${test.name} failed - Data inconsistency detected`,
                metrics: {
                    'Execution Time': `${(Math.random() * 5 + 2).toFixed(2)}s`,
                    'Data Validation': 'FAILED',
                    'Error Count': Math.floor(Math.random() * 10 + 1)
                }
            };
        }
    }

    showTestRunning(testId) {
        const testCard = document.querySelector(`[data-test="${testId}"]`).closest('.test-card');
        testCard.classList.add('border-yellow-500');
        
        const button = testCard.querySelector('.run-test');
        button.innerHTML = '<i class="bi bi-gear animate-spin"></i> Running...';
        button.disabled = true;
    }

    getTestCardClass(testId) {
        if (!this.completedTests.includes(testId)) {
            return 'border-gray-600';
        }
        
        const result = this.testResults[testId];
        return result?.success ? 'border-green-500' : 'border-red-500';
    }

    getTestStatusIcon(testId) {
        if (!this.completedTests.includes(testId)) {
            return '<i class="bi bi-clock text-gray-400"></i>';
        }
        
        const result = this.testResults[testId];
        return result?.success 
            ? '<i class="bi bi-check-circle-fill text-green-400"></i>'
            : '<i class="bi bi-x-circle-fill text-red-400"></i>';
    }

    getTestButtonClass(testId) {
        if (!this.completedTests.includes(testId)) {
            return 'bg-blue-600 hover:bg-blue-500';
        }
        
        const result = this.testResults[testId];
        return result?.success 
            ? 'bg-green-600' 
            : 'bg-red-600';
    }

    getTestButtonText(testId) {
        if (!this.completedTests.includes(testId)) {
            return '<i class="bi bi-play-fill"></i> Run Test';
        }
        
        const result = this.testResults[testId];
        return result?.success 
            ? '<i class="bi bi-check"></i> Test Passed'
            : '<i class="bi bi-x"></i> Test Failed';
    }

    renderTestResult(testId) {
        if (!this.completedTests.includes(testId)) {
            return '';
        }
        
        const result = this.testResults[testId];
        const statusColor = result.success ? 'text-green-400' : 'text-red-400';
        
        return `
            <div class="test-result mt-3 p-3 bg-black rounded">
                <div class="result-header font-bold ${statusColor} mb-2">
                    ${result.details.status}: ${result.details.message}
                </div>
                <div class="result-metrics text-xs text-gray-400">
                    ${Object.entries(result.details.metrics).map(([key, value]) => 
                        `<div>${key}: <span class="text-white">${value}</span></div>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    getPassedTests() {
        return this.completedTests.filter(testId => 
            this.testResults[testId]?.success
        ).length;
    }

    getFailedTests() {
        return this.completedTests.filter(testId => 
            !this.testResults[testId]?.success
        ).length;
    }

    getOverallScore() {
        if (this.completedTests.length === 0) return 0;
        return Math.round((this.getPassedTests() / this.completedTests.length) * 100);
    }

    completeVerification() {
        const overallScore = this.getOverallScore();
        
        if (overallScore >= 75) {
            this.room.databaseRecovered();
        } else {
            this.room.game.gameOver(`Database verification failed! Only ${overallScore}% of tests passed. Data integrity insufficient for production use.`);
        }
    }
}
