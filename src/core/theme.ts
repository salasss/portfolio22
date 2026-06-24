// Thème nuit/lumière : pilote data-theme, persiste, et notifie les modules canvas
// (qui doivent re-lire les couleurs CSS).
import type { Cleanup, Theme, ThemeColors } from '../types'

const STORAGE_KEY = 'sa.theme'
const subs = new Set<(t: Theme) => void>()
let theme: Theme = readInitial()

function readInitial(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return 'dark' // défaut = NUIT (on n'utilise pas prefers-color-scheme pour le défaut)
}

export const getTheme = (): Theme => theme

/** Lit les couleurs effectives depuis les CSS custom properties. */
export function getColors(): ThemeColors {
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string) => cs.getPropertyValue(name).trim()
  return {
    bg: v('--bg'),
    text: v('--text'),
    dim: v('--text-dim'),
    gradA: v('--grad-a'),
    gradB: v('--grad-b'),
    line: v('--line'),
  }
}

export function setTheme(next: Theme): void {
  if (next === theme) return
  theme = next
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
  // Laisse le navigateur appliquer les nouvelles CSS vars avant de notifier.
  requestAnimationFrame(() => {
    for (const fn of subs) fn(theme)
  })
}

export function toggleTheme(): void {
  setTheme(theme === 'dark' ? 'light' : 'dark')
}

export function onThemeChange(fn: (t: Theme) => void): Cleanup {
  subs.add(fn)
  return () => subs.delete(fn)
}

/** À appeler au boot : pose l'attribut data-theme initial. */
export function initTheme(): void {
  document.documentElement.setAttribute('data-theme', theme)
}
