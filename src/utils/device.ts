export const isTouch = (): boolean =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Device pixel ratio borné (évite des canvas énormes sur écrans HiDPI). */
export const dpr = (max = 2): number =>
  Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, max)

export const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
