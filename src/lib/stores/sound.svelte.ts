// Sound effects store using Svelte 5 runes
import { browser } from '$app/environment'

type SoundEffect =
  | 'click'
  | 'success'
  | 'error'
  | 'drag-start'
  | 'drop'
  | 'send'
  | 'receive'
  | 'toggle'

// Subtle, pleasant sounds using Web Audio API
class SoundStore {
  #enabled = $state(true)
  #volume = $state(0.3)
  #audioContext: AudioContext | null = null

  constructor() {
    if (browser) {
      const saved = localStorage.getItem('specflow-sound')
      if (saved) {
        const { enabled, volume } = JSON.parse(saved)
        this.#enabled = enabled ?? true
        this.#volume = volume ?? 0.3
      }
    }
  }

  get enabled() {
    return this.#enabled
  }

  get volume() {
    return this.#volume
  }

  setEnabled(enabled: boolean) {
    this.#enabled = enabled
    this.#persist()
  }

  setVolume(volume: number) {
    this.#volume = Math.max(0, Math.min(1, volume))
    this.#persist()
  }

  toggle() {
    this.setEnabled(!this.#enabled)
  }

  play(effect: SoundEffect) {
    if (!this.#enabled || !browser) return

    // Initialize audio context on first interaction
    if (!this.#audioContext) {
      this.#audioContext = new AudioContext()
    }

    const ctx = this.#audioContext
    const now = ctx.currentTime

    // Create gain node for volume control
    const gainNode = ctx.createGain()
    gainNode.connect(ctx.destination)
    gainNode.gain.value = this.#volume

    // Different sounds for different effects
    switch (effect) {
      case 'click':
        this.#playClick(ctx, gainNode, now)
        break
      case 'success':
        this.#playSuccess(ctx, gainNode, now)
        break
      case 'error':
        this.#playError(ctx, gainNode, now)
        break
      case 'drag-start':
        this.#playDragStart(ctx, gainNode, now)
        break
      case 'drop':
        this.#playDrop(ctx, gainNode, now)
        break
      case 'send':
        this.#playSend(ctx, gainNode, now)
        break
      case 'receive':
        this.#playReceive(ctx, gainNode, now)
        break
      case 'toggle':
        this.#playToggle(ctx, gainNode, now)
        break
    }
  }

  // Soft click - very short, subtle
  #playClick(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05)

    gain.gain.setValueAtTime(this.#volume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  // Success - pleasant ascending tone
  #playSuccess(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, now) // C5
    osc.frequency.setValueAtTime(659, now + 0.1) // E5

    gain.gain.setValueAtTime(this.#volume * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.2)
  }

  // Error - soft descending tone
  #playError(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15)

    gain.gain.setValueAtTime(this.#volume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.15)
  }

  // Drag start - light "lift" sound
  #playDragStart(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08)

    gain.gain.setValueAtTime(this.#volume * 0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  // Drop - satisfying "click" sound
  #playDrop(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)

    gain.gain.setValueAtTime(this.#volume * 0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  // Send - whoosh up
  #playSend(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12)

    gain.gain.setValueAtTime(this.#volume * 0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.12)
  }

  // Receive - soft chime
  #playReceive(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now) // A5

    gain.gain.setValueAtTime(this.#volume * 0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.3)
  }

  // Toggle - switch click
  #playToggle(ctx: AudioContext, gain: GainNode, now: number) {
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1200, now)

    gain.gain.setValueAtTime(this.#volume * 0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.03)
  }

  #persist() {
    if (browser) {
      localStorage.setItem('specflow-sound', JSON.stringify({
        enabled: this.#enabled,
        volume: this.#volume
      }))
    }
  }
}

export const sound = new SoundStore()
