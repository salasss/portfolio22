// Boucle requestAnimationFrame UNIQUE et partagée par tout le site.
// Chaque module s'abonne via onTick() et reçoit (dt en s, t en s).
import type { Cleanup } from '../types'

type TickFn = (dt: number, t: number) => void

const subs = new Set<TickFn>()
let started = false
let last = 0

function loop(now: number): void {
  const t = now / 1000
  const dt = last === 0 ? 0 : Math.min(t - last, 0.05) // clamp anti-saut (onglet inactif)
  last = t
  for (const fn of subs) fn(dt, t)
  requestAnimationFrame(loop)
}

export function startTicker(): void {
  if (started) return
  started = true
  requestAnimationFrame(loop)
}

export function onTick(fn: TickFn): Cleanup {
  subs.add(fn)
  return () => subs.delete(fn)
}
