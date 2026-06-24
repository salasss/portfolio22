// ============================================================
// cursor.ts — curseur custom desktop (point + anneau follower).
// Le point suit la souris immédiatement ; l'anneau suit en lerp via onTick.
// Délégation pointerover/out pour les états hover / view.
// ============================================================
import { onTick } from './ticker'
import { sound } from './sound'
import { qsOpt, on, onEl } from '../utils/dom'
import { lerp, clamp } from '../utils/math'
import { prefersReducedMotion } from '../utils/device'

/** Sélecteurs qui activent l'anneau "hover". */
const HOVER_SELECTOR = 'a, button, [data-magnetic]'
/** Sélecteurs qui activent en plus l'état "view" (label VIEW). */
const VIEW_SELECTOR = '.project-card, [data-external]'

/** Compose une transform de centrage + position absolue (en px). */
function place(x: number, y: number): string {
  return `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
}

export function initCursor(): void {
  const dot = qsOpt<HTMLElement>('#cursor')
  const follower = qsOpt<HTMLElement>('#cursor-follower')
  if (!dot || !follower) return

  const reduce = prefersReducedMotion()

  // Position souris (suivie en continu) + position lissée de l'anneau.
  let mx = window.innerWidth / 2
  let my = window.innerHeight / 2
  let fx = mx
  let fy = my
  let visible = false

  const show = (): void => {
    if (visible) return
    visible = true
    dot.style.opacity = '1'
    follower.style.opacity = '1'
  }
  const hide = (): void => {
    if (!visible) return
    visible = false
    dot.style.opacity = '0'
    follower.style.opacity = '0'
  }

  // Position initiale (cachée tant que la souris n'a pas bougé).
  dot.style.opacity = '0'
  follower.style.opacity = '0'
  dot.style.transform = place(mx, my)
  follower.style.transform = place(fx, fy)

  // ---- Suivi souris : le point suit immédiatement ----
  on(window, 'pointermove', (e: PointerEvent) => {
    mx = clamp(e.clientX, 0, window.innerWidth)
    my = clamp(e.clientY, 0, window.innerHeight)
    dot.style.transform = place(mx, my)
    if (reduce) {
      // Pas de lerp : l'anneau colle directement au point.
      fx = mx
      fy = my
      follower.style.transform = place(fx, fy)
    }
    show()
  })

  // ---- Boucle de lerp pour l'anneau (sauf reduced-motion) ----
  if (!reduce) {
    onTick((dt: number) => {
      // Coefficient indépendant du framerate (≈ 0.18 @60fps).
      const k = 1 - Math.pow(0.001, dt)
      fx = lerp(fx, mx, k)
      fy = lerp(fy, my, k)
      follower.style.transform = place(fx, fy)
    })
  }

  // ---- Délégation hover / view sur le document ----
  onEl(document, 'pointerover', (e: Event) => {
    const target = e.target
    if (!(target instanceof Element)) return
    const hoverEl = target.closest(HOVER_SELECTOR)
    if (hoverEl && !follower.classList.contains('is-hover')) {
      follower.classList.add('is-hover')
      sound.play('hover')
    }
    if (target.closest(VIEW_SELECTOR)) {
      follower.classList.add('is-view')
    }
  })

  onEl(document, 'pointerout', (e: Event) => {
    const target = e.target
    if (!(target instanceof Element)) return
    if (target.closest(HOVER_SELECTOR)) {
      follower.classList.remove('is-hover')
    }
    if (target.closest(VIEW_SELECTOR)) {
      follower.classList.remove('is-view')
    }
  })

  // ---- Visibilité quand la souris quitte / entre dans la fenêtre ----
  onEl(document, 'mouseleave', hide)
  onEl(document, 'mouseenter', show)
}
