export class AudioManager {
    constructor(room) {
        this.room = room;
        this.sounds = new Map();
        this.soundEnabled = true;
    }

    async loadSounds() {
        const soundFiles = {
            'shield_block': 'static/audio/shield-block.mp3',
            'network_hit': 'static/audio/network-hit.mp3',
            'wave_complete': 'static/audio/wave-complete.mp3',
            'defense_start': 'static/audio/defense-start.mp3',
            'defense_complete': 'static/audio/defense-complete.mp3',
            'game_over': 'static/audio/game-over.mp3',
            'alien_spawn': 'static/audio/alien-spawn.mp3'
        };

        // Load audio files with fallback handling
        for (const [key, path] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio();
                audio.volume = 0.3;
                audio.preload = 'none'; // Don't preload to avoid 404 errors
                
                // Test if file exists before setting src
                const response = await fetch(path, { method: 'HEAD' }).catch(() => null);
                if (response && response.ok) {
                    audio.src = path;
                    audio.preload = 'auto';
                }
                
                this.sounds.set(key, audio);
            } catch (error) {
                console.warn(`Failed to load sound: ${key}`, error);
                // Create a silent audio object as fallback
                this.sounds.set(key, { play: () => {}, pause: () => {}, currentTime: 0 });
            }
        }
    }

    playSound(soundKey) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds.get(soundKey);
        if (sound && sound.play) {
            try {
                sound.currentTime = 0; // Reset to beginning
                const playPromise = sound.play();
                if (playPromise) {
                    playPromise.catch(e => {
                        console.warn(`Failed to play sound ${soundKey}:`, e);
                    });
                }
            } catch (error) {
                console.warn(`Error playing sound ${soundKey}:`, error);
            }
        } else {
            console.warn(`Sound not found: ${soundKey}`);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    setSoundVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = clampedVolume;
        });
    }
}
