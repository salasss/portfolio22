// ============================================================
// MagneticButton.ts — effet magnétique sur les [data-magnetic].
// L'élément est attiré vers le curseur (transform only, pas de
// réflow), puis revient élastiquement à l'origine au pointerleave.
// Désactivé sur pointeur grossier / tactile et reduced-motion.
// ============================================================
import { gsap } from '../core/gsap'
import { qsa, onEl } from '../utils/dom'
import { clamp } from '../utils/math'
import { isCoarsePointer, isTouch, prefersReducedMotion } from '../utils/device'

/** Force d'attraction (fraction du delta curseur ↔ centre). */
const STRENGTH = 0.35
/** Zone sensible au-delà des bords de l'élément (px). */
const PADDING = 40
/** Plafond de déplacement pour éviter qu'un grand bouton ne « fuie » trop loin. */
const MAX_SHIFT = 60

/**
 * Active l'effet magnétique sur tous les éléments [data-magnetic].
 * No-op total sur tactile / pointeur grossier (return tôt).
 */
export function initMagnetic(): void {
  if (isCoarsePointer() || isTouch() || prefersReducedMotion()) return

  for (const elem of qsa<HTMLElement>('[data-magnetic]')) {
    attach(elem)
  }
}

function attach(elem: HTMLElement): void {
  // quickTo : setters ultra-fluides réutilisés à chaque pointermove.
  const moveX = gsap.quickTo(elem, 'x', { duration: 0.5, ease: 'power3.out' })
  const moveY = gsap.quickTo(elem, 'y', { duration: 0.5, ease: 'power3.out' })

  onEl(elem, 'pointermove', (e) => {
    const ev = e as PointerEvent
    const rect = elem.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    // Hors zone sensible (rect + padding) : on relâche vers l'origine.
    if (
      ev.clientX < rect.left - PADDING ||
      ev.clientX > rect.right + PADDING ||
      ev.clientY < rect.top - PADDING ||
      ev.clientY > rect.bottom + PADDING
    ) {
      moveX(0)
      moveY(0)
      return
    }

    moveX(clamp((ev.clientX - cx) * STRENGTH, -MAX_SHIFT, MAX_SHIFT))
    moveY(clamp((ev.clientY - cy) * STRENGTH, -MAX_SHIFT, MAX_SHIFT))
  })

  onEl(elem, 'pointerleave', () => {
    // Retour élastique à l'origine ; tue le quickTo en cours.
    gsap.to(elem, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)', overwrite: true })
  })
}
