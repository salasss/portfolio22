// Sound design maison (WebAudio) — OFF par défaut, aucun fichier à télécharger.
// Sons synthétisés à la volée. Respecte mute + prefers-reduced-motion + politique autoplay.
import { prefersReducedMotion } from '../utils/device'

export type SoundName = 'hover' | 'click' | 'open' | 'close' | 'toggle'

const STORAGE_KEY = 'sa.muted'
const FREQ: Record<SoundName, number> = {
  hover: 880,
  click: 440,
  open: 560,
  close: 360,
  toggle: 660,
}

let muted = localStorage.getItem(STORAGE_KEY) !== 'false' // défaut : true (OFF)
let ctx: AudioContext | null = null

function ensureCtx(): AudioContext | null {
  if (prefersReducedMotion()) return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export const sound = {
  isMuted: (): boolean => muted,

  /** Débloque l'audio au 1er geste utilisateur (politique autoplay). */
  unlock(): void {
    if (!muted) ensureCtx()
  },

  toggleMute(): boolean {
    muted = !muted
    localStorage.setItem(STORAGE_KEY, String(muted))
    document.body.classList.toggle('is-muted', muted)
    const sound = document.querySelector('#sound-toggle')
    sound?.setAttribute('aria-pressed', String(!muted))
    if (!muted) {
      ensureCtx()
      this.play('toggle')
    }
    return muted
  },

  play(name: SoundName): void {
    if (muted) return
    const ac = ensureCtx()
    if (!ac) return
    const now = ac.currentTime
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = name === 'hover' ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(FREQ[name], now)
    osc.frequency.exponentialRampToValueAtTime(FREQ[name] * 0.6, now + 0.12)
    const peak = name === 'hover' ? 0.04 : 0.08
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    osc.connect(gain).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  },
}

/** À appeler au boot : pose l'état mute initial + désamorce l'audio au 1er geste. */
export function initSound(): void {
  document.body.classList.toggle('is-muted', muted)
  document.querySelector('#sound-toggle')?.setAttribute('aria-pressed', String(!muted))
  const unlock = () => sound.unlock()
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}
