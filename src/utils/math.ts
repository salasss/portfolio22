export const TAU = Math.PI * 2

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v

/** Remappe v de [inMin,inMax] vers [outMin,outMax]. */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin)

export const dist = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1)

/** Aléatoire dans [min,max). */
export const rand = (min: number, max: number): number => min + Math.random() * (max - min)

/** Aléatoire entier dans [min,max]. */
export const randInt = (min: number, max: number): number => Math.floor(rand(min, max + 1))

export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T

/** Bruit de valeur lisse 1D (pseudo-perlin léger, sans dépendance). */
export const smoothNoise = (x: number): number => {
  const xi = Math.floor(x)
  const xf = x - xi
  const u = xf * xf * (3 - 2 * xf)
  const a = pseudoRand(xi)
  const b = pseudoRand(xi + 1)
  return lerp(a, b, u)
}

const pseudoRand = (n: number): number => {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}
