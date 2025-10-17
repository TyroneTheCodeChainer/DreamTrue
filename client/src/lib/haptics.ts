// Haptic feedback utilities for mobile PWA

export const haptics = {
  // Light tap for button press
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium pulse for recording start/stop
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  // Success pattern for completion
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 50, 20]);
    }
  },

  // Calming pattern for breathing
  breathe: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }
};

// Gentle sound effects using Web Audio API
class SoundEffects {
  private audioContext: AudioContext | null = null;
  private isSupported = false;

  constructor() {
    // Check for Web Audio API support
    this.isSupported = !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  private async getContext() {
    if (!this.isSupported) {
      return null;
    }

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        this.isSupported = false;
        return null;
      }
    }

    // Resume context if suspended (required for iOS)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }

    return this.audioContext;
  }

  // Soft chime for recording start
  async playRecordStart() {
    const ctx = await this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 523.25; // C5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  // Gentle completion sound
  async playComplete() {
    const ctx = await this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 659.25; // E5 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  // Soft breathing bell
  async playBreathingBell() {
    const ctx = await this.getContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 440; // A4 note
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }
}

export const sounds = new SoundEffects();
