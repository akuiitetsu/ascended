export class ShieldManager {
    constructor(room) {
        this.room = room;
    }

    createShieldElement() {
        const shield = document.createElement('div');
        shield.id = 'shield';
        shield.className = 'absolute rounded-full cursor-move';
        shield.style.width = `${this.room.shieldSize}px`;
        shield.style.height = `${this.room.shieldSize}px`;
        shield.style.left = `${this.room.shieldPosition.x - this.room.shieldSize/2}px`;
        shield.style.top = `${this.room.shieldPosition.y - this.room.shieldSize/2}px`;
        shield.style.backgroundColor = '#3b82f6';
        shield.style.opacity = '0.8';
        shield.style.zIndex = '10';
        shield.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
        shield.style.border = '2px solid rgba(255, 255, 255, 0.8)';
        shield.style.pointerEvents = 'auto';
        shield.style.userSelect = 'none';
        
        // Add visual indicator that this is a shield
        shield.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 24px; color: white;">🛡️</div>';
        
        console.log('Shield element created:', shield);
        return shield;
    }

    setupShieldControls() {
        const gameArea = document.getElementById('defense-game');
        const shield = document.getElementById('shield');
        
        if (!gameArea || !shield) {
            console.error('Game area or shield not found for controls setup');
            return;
        }
        
        let isDragging = false;
        
        // Mouse controls - simplified for better tracking
        gameArea.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = gameArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.moveShield(x, y);
            console.log('Mouse down, shield move started');
        });
        
        gameArea.addEventListener('mousemove', (e) => {
            // Always move shield when mouse is in area and defense is active
            if (this.room.isDefending || isDragging) {
                const rect = gameArea.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.moveShield(x, y);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                console.log('Mouse up, drag ended');
            }
            isDragging = false;
        });
        
        // Also add click handler to shield itself
        shield.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
            console.log('Shield clicked, drag started');
        });
        
        // Touch controls for mobile
        gameArea.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
            const rect = gameArea.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.moveShield(x, y);
        });
        
        gameArea.addEventListener('touchmove', (e) => {
            if (isDragging || this.room.isDefending) {
                e.preventDefault();
                const rect = gameArea.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                this.moveShield(x, y);
            }
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        console.log('Shield controls setup complete');
    }

    moveShield(x, y) {
        // Keep shield within game area bounds
        const gameArea = document.getElementById('defense-game');
        if (!gameArea) return;
        
        const maxX = gameArea.offsetWidth - this.room.shieldSize/2;
        const maxY = gameArea.offsetHeight - this.room.shieldSize/2;
        
        x = Math.max(this.room.shieldSize/2, Math.min(maxX, x));
        y = Math.max(this.room.shieldSize/2, Math.min(maxY, y));
        
        this.room.shieldPosition.x = x;
        this.room.shieldPosition.y = y;
        
        const shield = document.getElementById('shield');
        if (shield) {
            shield.style.left = `${x - this.room.shieldSize/2}px`;
            shield.style.top = `${y - this.room.shieldSize/2}px`;
            
            // Add visual feedback for movement
            shield.style.transition = 'none'; // Remove transition for smooth tracking
        }
    }

    checkShieldCollision(attack) {
        const distance = Math.sqrt(
            Math.pow(attack.x - this.room.shieldPosition.x, 2) + 
            Math.pow(attack.y - this.room.shieldPosition.y, 2)
        );
        
        const collisionThreshold = this.room.shieldSize/2 + attack.size/2;
        
        if (distance <= collisionThreshold) {
            // Block attack and reduce shield strength
            const damage = attack.damage || 15;
            this.room.shieldStrength = Math.max(0, this.room.shieldStrength - damage);
            
            // Visual feedback for successful block
            this.showShieldImpact();
            this.room.audioManager.playSound('shield_block');
            
            return true; // Attack blocked
        }
        
        return false; // Attack missed shield
    }

    updateShieldStrength() {
        // Regenerate shield strength slowly when not under heavy attack
        if (this.room.shieldStrength < 100 && this.room.isDefending) {
            this.room.shieldStrength = Math.min(100, this.room.shieldStrength + 0.3);
        }
        
        // Update visual shield strength
        const shield = document.getElementById('shield');
        if (shield) {
            const strengthRatio = this.room.shieldStrength / 100;
            shield.style.opacity = Math.max(0.3, 0.8 * strengthRatio);
            
            // Change color based on strength
            if (strengthRatio > 0.7) {
                shield.style.backgroundColor = '#3b82f6'; // Blue - strong
                shield.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
            } else if (strengthRatio > 0.4) {
                shield.style.backgroundColor = '#f59e0b'; // Orange - medium
                shield.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.6)';
            } else {
                shield.style.backgroundColor = '#ef4444'; // Red - weak
                shield.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
            }
            
            // Add warning effects when shield is low
            if (strengthRatio < 0.3) {
                shield.style.animation = 'pulse 0.5s infinite';
            } else {
                shield.style.animation = 'none';
            }
        }
    }

    showShieldImpact() {
        const shield = document.getElementById('shield');
        if (shield) {
            shield.style.transform = 'scale(1.2)';
            shield.style.boxShadow = '0 0 30px rgba(59, 130, 246, 1)';
            
            setTimeout(() => {
                shield.style.transform = 'scale(1)';
                shield.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.6)';
            }, 150);
        }
    }
}
