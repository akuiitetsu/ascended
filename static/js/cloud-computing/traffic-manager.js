export class TrafficManager {
    constructor(room) {
        this.room = room;
    }

    updateTraffic() {
        // Get base traffic from pattern with proper time-based progression
        let baseTraffic = 500; // Starting traffic
        
        // Find the appropriate traffic pattern based on game time
        const relevantPatterns = this.room.data.traffic_patterns.filter(pattern => pattern.time <= this.room.gameTime);
        if (relevantPatterns.length > 0) {
            const currentPattern = relevantPatterns[relevantPatterns.length - 1]; // Get the latest applicable pattern
            baseTraffic = currentPattern.requests_per_second;
            
            // If there's a next pattern, interpolate between current and next
            const nextPattern = this.room.data.traffic_patterns.find(pattern => pattern.time > this.room.gameTime);
            if (nextPattern) {
                const timeDiff = nextPattern.time - currentPattern.time;
                const timeProgress = this.room.gameTime - currentPattern.time;
                const progressRatio = timeProgress / timeDiff;
                
                // Linear interpolation between current and next traffic levels
                const trafficDiff = nextPattern.requests_per_second - currentPattern.requests_per_second;
                baseTraffic = currentPattern.requests_per_second + (trafficDiff * progressRatio);
            }
        }
        
        // Add small controlled randomness (±2% instead of ±5% for more stability)
        const randomVariation = baseTraffic * 0.02 * (Math.random() - 0.5);
        const targetTraffic = Math.max(0, baseTraffic + randomVariation);
        
        // Smooth the traffic changes
        this.room.smoothedTraffic += (targetTraffic - this.room.smoothedTraffic) * this.room.smoothingFactor;
        this.room.currentTraffic = Math.round(this.room.smoothedTraffic);
    }

    updateTrafficVisualization() {
        // Calculate particle spawn rate based on current traffic
        const trafficLevel = this.room.currentTraffic;
        
        // Base spawn chance scales with traffic volume
        let particleSpawnChance = Math.min(trafficLevel / 1000, 1.0); // Scale from 0 to 1 based on traffic
        
        // Minimum spawn chance to always show some activity
        particleSpawnChance = Math.max(particleSpawnChance, 0.1);
        
        // For very high traffic, spawn multiple particles per frame
        let particlesToSpawn = 1;
        if (trafficLevel > 10000) {
            particlesToSpawn = Math.min(Math.floor(trafficLevel / 5000), 5); // Up to 5 particles at once
            particleSpawnChance = 0.8; // High chance to spawn when traffic is massive
        } else if (trafficLevel > 5000) {
            particlesToSpawn = 2;
            particleSpawnChance = 0.6;
        } else if (trafficLevel > 2000) {
            particleSpawnChance = 0.4;
        }
        
        // Only spawn if we have internet connections
        if (this.room.internetNode && this.room.internetNode.connections.length > 0) {
            for (let i = 0; i < particlesToSpawn; i++) {
                if (Math.random() < particleSpawnChance) {
                    this.createTrafficParticle();
                }
            }
        }
    }

    createTrafficParticle() {
        // Always start traffic from the internet node
        if (!this.room.internetNode || this.room.internetNode.connections.length === 0) return;

        // Choose a random node connected to internet (or the only one if there's just one)
        const targetNodeId = this.room.internetNode.connections[Math.floor(Math.random() * this.room.internetNode.connections.length)];
        const targetNode = this.room.nodes.find(n => n.id === targetNodeId);
        
        if (!targetNode) return;

        const particle = document.createElement('div');
        particle.className = 'traffic-particle absolute';
        
        // Vary particle size based on traffic intensity
        const trafficIntensity = this.room.currentTraffic / 1000;
        const particleSize = Math.max(4, Math.min(10, 4 + trafficIntensity * 0.5));
        
        particle.style.width = `${particleSize}px`;
        particle.style.height = `${particleSize}px`;
        particle.style.backgroundColor = this.getTrafficColor();
        particle.style.borderRadius = '50%';
        
        // Add slight random offset to spread particles out from internet node
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        
        particle.style.left = `${this.room.internetNode.x - particleSize/2 + offsetX}px`;
        particle.style.top = `${this.room.internetNode.y - particleSize/2 + offsetY}px`;
        particle.style.zIndex = '15';
        particle.style.boxShadow = `0 0 ${particleSize * 2}px ${particle.style.backgroundColor}`;
        particle.style.transition = 'all 0.1s ease-out';
        particle.dataset.startTime = Date.now();
        
        // Add pulsing animation for high traffic
        const loadPercentage = (this.room.currentTraffic / Math.max(this.room.totalCapacity, 1)) * 100;
        if (loadPercentage > 70) {
            particle.style.animation = 'pulse 0.5s infinite alternate';
        }
        
        // Add slight random rotation for visual variety
        particle.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        this.room.gameArea.appendChild(particle);
        
        // Animate particle from internet to first node
        this.animateParticleAlongPath(particle, this.room.internetNode, targetNode);
    }

    animateParticleAlongPath(particle, startNode, targetNode) {
        const startTime = Date.now();
        
        // Speed varies slightly with load but not dramatically
        const loadPercentage = (this.room.currentTraffic / Math.max(this.room.totalCapacity, 1)) * 100;
        const speedMultiplier = Math.max(0.8, Math.min(1.5, 1 + (loadPercentage - 50) / 200)); // 0.8x to 1.5x speed
        const duration = (1200 + Math.random() * 600) / speedMultiplier; // 1.2-1.8 seconds, slightly faster with high load
        
        const startX = startNode.x;
        const startY = startNode.y;
        const endX = targetNode.x;
        const endY = targetNode.y;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Calculate current position
            const currentX = startX + (endX - startX) * easeProgress;
            const currentY = startY + (endY - startY) * easeProgress;
            
            const particleSize = parseFloat(particle.style.width);
            particle.style.left = `${currentX - particleSize/2}px`;
            particle.style.top = `${currentY - particleSize/2}px`;
            
            // Add subtle pulsing effect for overloaded systems
            if (loadPercentage > 90) {
                const pulseScale = 1 + Math.sin(elapsed * 0.02) * 0.3;
                particle.style.transform = `scale(${pulseScale}) rotate(${elapsed * 0.1}deg)`;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Particle reached destination, continue to next connection if available
                const availableConnections = targetNode.connections.filter(id => 
                    id !== startNode.id && id !== 'internet' // Don't go back to where we came from
                );
                
                if (availableConnections.length > 0 && Math.random() < 0.6) {
                    // 60% chance to continue to another node (reduced from 70% to prevent too long chains)
                    const nextNodeId = availableConnections[Math.floor(Math.random() * availableConnections.length)];
                    const nextNode = this.room.nodes.find(n => n.id === nextNodeId);
                    
                    if (nextNode) {
                        // Continue journey to next node
                        setTimeout(() => {
                            this.animateParticleAlongPath(particle, targetNode, nextNode);
                        }, 30); // Very short delay for continuous flow
                        return;
                    }
                }
                
                // End of journey - remove particle with fade effect
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0.2)';
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 150);
            }
        };
        
        animate();
    }

    getTrafficColor() {
        const loadPercentage = (this.room.currentTraffic / Math.max(this.room.totalCapacity, 1)) * 100;
        
        if (loadPercentage > 100) {
            return '#ef4444'; // Red for overload
        } else if (loadPercentage > 80) {
            return '#f59e0b'; // Orange for high load
        } else if (loadPercentage > 50) {
            return '#3b82f6'; // Blue for medium load
        } else if (loadPercentage > 25) {
            return '#10b981'; // Green for normal load
        } else {
            return '#6b7280'; // Gray for low load
        }
    }

    updateTrafficParticles() {
        // Clean up old particles that might be stuck
        const particles = this.room.gameArea.querySelectorAll('.traffic-particle');
        particles.forEach(particle => {
            // Remove particles that have been around too long (failsafe)
            if (!particle.dataset.startTime) {
                particle.dataset.startTime = Date.now();
            } else if (Date.now() - parseInt(particle.dataset.startTime) > 8000) { // Reduced from 10s to 8s
                particle.remove();
            }
        });
        
        // Show particle count for debugging (optional)
        if (particles.length > 50) { // If too many particles, clean up more aggressively
            const oldestParticles = Array.from(particles)
                .sort((a, b) => parseInt(a.dataset.startTime) - parseInt(b.dataset.startTime))
                .slice(0, 10);
            oldestParticles.forEach(p => p.remove());
        }
    }
}