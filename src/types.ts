// ============================================================
// Types partagés — contrat unique pour tout le projet.
// ============================================================

export type Lang = 'fr' | 'en'
export type Theme = 'dark' | 'light'

/** Valeur traduite FR/EN. */
export type Localized<T> = Record<Lang, T>

/** Couleurs lues depuis les CSS custom properties (re-lues au changement de thème). */
export interface ThemeColors {
  bg: string
  text: string
  dim: string
  gradA: string
  gradB: string
  line: string
}

/** Fonction de nettoyage retournée par les init() (désabonnement / teardown). */
export type Cleanup = () => void

/** Pôle de compétences (cluster). */
export interface SkillPole {
  key: string
  /** Libellé affiché dans la légende. */
  label: Localized<string>
  /** Couleur de référence (hex) — mélangée au dégradé pour l'affichage. */
  color: string
}

/** Une compétence = une bulle metaball. */
export interface Skill {
  name: string
  pole: string // SkillPole.key
  level: number // 1..5 -> taille de la bulle
  note: Localized<string>
}

/** Un projet (carte + popup). */
export interface Project {
  id: string
  index: string // "01"
  title: string
  tagline: Localized<string>
  role: Localized<string>
  problem: Localized<string>
  solution: Localized<string>
  bullets: Localized<string[]>
  stack: string[]
  github?: string
  demo?: string
}

/** Une expérience pro (timeline). */
export interface Experience {
  date: Localized<string>
  role: Localized<string>
  company: string
  location: string
  bullets: Localized<string[]>
  tags: string[]
}

/** Élément de la section "Now" / engagement / certifs. */
export interface NowItem {
  label: Localized<string>
}

/** Dictionnaire i18n pour le chrome statique ([data-i18n]). */
export type UIStrings = Record<string, string>
