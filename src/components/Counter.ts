// ============================================================
// Counter.ts — compteurs KPI ([data-counter]).
// Anime 0 -> target au scroll (ScrollTrigger, once), ou affiche
// un texte fixe (data-text) avec un court effet scramble.
// ============================================================
import { gsap, ScrollTrigger } from '../core/gsap'
import { prefersReducedMotion } from '../utils/device'
import { qsa } from '../utils/dom'

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#0123456789'

/** Pioche un caractère « bruit » pour l'effet scramble. */
function noiseChar(pool: string): string {
  const i = Math.floor(Math.random() * pool.length)
  return pool.charAt(i) || SCRAMBLE_CHARS.charAt(0)
}

/**
 * Effet scramble (~0.6s) qui résout vers `text`, piloté par GSAP
 * (pas de requestAnimationFrame direct).
 */
function scrambleTo(el: HTMLElement, text: string): void {
  const final = text
  const pool = (final.replace(/\s+/g, '') || SCRAMBLE_CHARS) + SCRAMBLE_CHARS
  const progress = { v: 0 }
  gsap.to(progress, {
    v: 1,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => {
      const revealed = Math.floor(progress.v * final.length)
      let out = ''
      for (let i = 0; i < final.length; i++) {
        const ch = final.charAt(i)
        if (i < revealed || ch === ' ') out += ch
        else out += noiseChar(pool)
      }
      el.textContent = out
    },
    onComplete: () => {
      el.textContent = final
    },
  })
}

/** Anime un nombre de 0 -> target sur l'élément. */
function countTo(el: HTMLElement, target: number, prefix: string, suffix: string): void {
  const obj = { v: 0 }
  gsap.to(obj, {
    v: target,
    duration: 1.6,
    ease: 'expo.out',
    onUpdate: () => {
      el.textContent = prefix + Math.round(obj.v) + suffix
    },
    onComplete: () => {
      el.textContent = prefix + target + suffix
    },
  })
}

export function initCounters(): void {
  const reduced = prefersReducedMotion()

  for (const el of qsa<HTMLElement>('[data-counter]')) {
    const prefix = el.dataset.prefix ?? ''
    const suffix = el.dataset.suffix ?? ''
    const text = el.dataset.text
    const rawTarget = el.dataset.target ?? ''
    const target = Number.parseFloat(rawTarget)
    const hasTarget = rawTarget.trim() !== '' && Number.isFinite(target)

    // --- Cas 1 : texte fixe (data-text) ---
    if (text !== undefined) {
      if (reduced) {
        el.textContent = text
        continue
      }
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => scrambleTo(el, text),
      })
      continue
    }

    // --- Cas 2 : compteur numérique ---
    const finalNumber = hasTarget ? prefix + target + suffix : prefix + '0' + suffix

    if (reduced || !hasTarget) {
      el.textContent = finalNumber
      continue
    }

    el.textContent = prefix + '0' + suffix
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => countTo(el, target, prefix, suffix),
    })
  }
}
