// ============================================================
// scroll.ts — smooth scroll (Lenis) + scroll-lock + ancres.
// Respecte prefers-reduced-motion : scroll natif en fallback.
// ============================================================
import Lenis from 'lenis'
import { ScrollTrigger } from './gsap'
import { onTick } from './ticker'
import { prefersReducedMotion } from '../utils/device'
import { qsa } from '../utils/dom'

/** Instance unique (null tant que non initialisée ou en mode reduced-motion). */
let lenis: Lenis | null = null

/**
 * Résout l'élément cible d'une ancre `href="#id"`.
 * Renvoie `null` pour `#`, `#hero` ou cible introuvable (= haut de page).
 */
function resolveTarget(href: string): HTMLElement | null {
  const id = href.slice(1) // retire le '#'
  if (id === '' || id === 'hero') return null
  // L'id peut contenir des caractères à échapper pour querySelector.
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id
  return document.querySelector<HTMLElement>(`#${escaped}`)
}

/** Scrolle vers une cible (ou le haut de page si `target` est `null`). */
function scrollToTarget(target: HTMLElement | null): void {
  if (lenis) {
    if (target) lenis.scrollTo(target, { offset: 0 })
    else lenis.scrollTo(0)
    return
  }
  // Fallback natif (reduced-motion ou pas de Lenis).
  if (target) target.scrollIntoView({ behavior: 'smooth' })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Bind toutes les ancres internes `a[href^="#"]`. */
function bindAnchors(): void {
  for (const anchor of qsa<HTMLAnchorElement>('a[href^="#"]')) {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href')
      if (!href) return
      e.preventDefault()
      scrollToTarget(resolveTarget(href))
    })
  }
}

/** Initialise le smooth scroll (ou le scroll natif si reduced-motion). */
export function initSmoothScroll(): void {
  const root = document.documentElement

  if (prefersReducedMotion()) {
    // Pas de Lenis : on garde le scroll natif et on bind quand même les ancres.
    bindAnchors()
    return
  }

  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 })
  root.classList.add('lenis', 'lenis-smooth')

  const instance = lenis
  // Pilotage via le ticker partagé (jamais de requestAnimationFrame direct).
  onTick((_dt, t) => instance.raf(t * 1000))
  // Synchronise ScrollTrigger sur chaque tick de scroll Lenis.
  instance.on('scroll', () => ScrollTrigger.update())

  bindAnchors()
}

/** Verrouille le scroll (overlays / popups). */
export function lockScroll(): void {
  if (lenis) lenis.stop()
  else document.documentElement.style.overflow = 'hidden'
  document.documentElement.classList.add('lenis-stopped')
}

/** Déverrouille le scroll. */
export function unlockScroll(): void {
  if (lenis) lenis.start()
  else document.documentElement.style.overflow = ''
  document.documentElement.classList.remove('lenis-stopped')
}
