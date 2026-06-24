// Internationalisation FR/EN du chrome statique ([data-i18n]) + diffusion aux modules.
import type { Cleanup, Lang } from '../types'
import { ui } from '../data/content'
import { qsa } from '../utils/dom'

const STORAGE_KEY = 'sa.lang'
const subs = new Set<(l: Lang) => void>()
let lang: Lang = readInitial()

function readInitial(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'fr' || saved === 'en') return saved
  // Défaut : FR si le navigateur est francophone, sinon EN.
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'fr'
}

export const getLang = (): Lang => lang

export function t(key: string): string {
  return ui[lang][key] ?? ui.fr[key] ?? key
}

export function applyTranslations(): void {
  document.documentElement.lang = lang
  for (const node of qsa('[data-i18n]')) {
    const key = node.getAttribute('data-i18n')
    if (key) node.textContent = t(key)
  }
  // état visuel du toggle de langue
  for (const node of qsa('[data-lang-fr]')) node.classList.toggle('is-active', lang === 'fr')
  for (const node of qsa('[data-lang-en]')) node.classList.toggle('is-active', lang === 'en')
}

export function setLang(next: Lang): void {
  if (next === lang) return
  lang = next
  localStorage.setItem(STORAGE_KEY, lang)
  applyTranslations()
  for (const fn of subs) fn(lang)
}

export function toggleLang(): void {
  setLang(lang === 'fr' ? 'en' : 'fr')
}

export function onLangChange(fn: (l: Lang) => void): Cleanup {
  subs.add(fn)
  return () => subs.delete(fn)
}

/** À appeler au boot : applique la langue initiale. */
export function initI18n(): void {
  applyTranslations()
}
