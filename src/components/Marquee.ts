// ============================================================
// Marquee.ts — bandeau infini de la stack technique.
// Boucle sans couture (track dupliqué x2) animée via onTick,
// ralentie au survol (lerp du facteur de vitesse).
// ============================================================
import { stack } from '../data/content'
import { onTick } from '../core/ticker'
import { el, onEl } from '../utils/dom'
import { lerp } from '../utils/math'
import { prefersReducedMotion, isCoarsePointer } from '../utils/device'

const SPEED = 40 // px/s — vitesse de défilement de base
const HOVER_FACTOR = 0.15 // facteur de vitesse au survol (ralenti)
const FACTOR_SMOOTH = 8 // raideur du lerp du facteur (par seconde)

/** Construit la liste des items (un span par techno). */
function buildItems(): HTMLSpanElement[] {
  return stack.map((tech) => el('span', { class: 'marquee__item' }, tech))
}

export function initMarquee(root: HTMLElement): void {
  // Track : flux d'items dupliqué x2 pour une boucle continue.
  const track = el('div', { class: 'marquee__track' })

  const firstHalf = buildItems()
  const secondHalf = buildItems()
  // Copie marquée aria-hidden : duplicata purement visuel.
  for (const item of secondHalf) item.setAttribute('aria-hidden', 'true')

  for (const item of firstHalf) track.appendChild(item)
  for (const item of secondHalf) track.appendChild(item)

  root.replaceChildren(track)

  // Fallback statique : pas d'animation, le track reste figé.
  // (Le CSS force déjà transform:none en prefers-reduced-motion.)
  if (prefersReducedMotion()) return

  // Largeur d'une moitié du track : on boucle sur ce module.
  // scrollWidth inclut le gap entre les deux moitiés, ce qui garde
  // un espacement homogène au moment du reset.
  let halfWidth = track.scrollWidth / 2

  const ro = new ResizeObserver(() => {
    halfWidth = track.scrollWidth / 2
  })
  ro.observe(track)

  let offset = 0 // déplacement courant (px, positif), retranché en X
  let factor = 1 // facteur de vitesse courant (lissé)
  let targetFactor = 1 // facteur cible (1 = normal, HOVER_FACTOR = survol)

  // Ralentit au survol ; revient à pleine vitesse à la sortie.
  // (Pas de survol pertinent sur pointeur grossier / tactile.)
  if (!isCoarsePointer()) {
    onEl(root, 'pointerenter', () => {
      targetFactor = HOVER_FACTOR
    })
    onEl(root, 'pointerleave', () => {
      targetFactor = 1
    })
  }

  onTick((dt) => {
    if (halfWidth <= 0) return

    // Lissage du facteur de vitesse (indépendant du framerate).
    const k = 1 - Math.exp(-FACTOR_SMOOTH * dt)
    factor = lerp(factor, targetFactor, k)

    offset += SPEED * factor * dt
    // Reset modulo : boucle continue sans saut visible.
    if (offset >= halfWidth) offset -= halfWidth

    track.style.transform = `translate3d(${-offset}px, 0, 0)`
  })
}
