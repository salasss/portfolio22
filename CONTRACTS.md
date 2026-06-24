# CONTRACTS — API interne (à respecter STRICTEMENT par chaque module)

Projet : portfolio vanilla TS + GSAP + Lenis. Aucune nouvelle dépendance.
TS strict (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`,
`noImplicitOverride`). Pas de `any`. Gère les accès tableau potentiellement `undefined`.

## Imports partagés (chemins exacts)
- GSAP : `import { gsap, ScrollTrigger } from '../core/gsap'` (JAMAIS `import 'gsap'` direct).
- Lenis : `import Lenis from 'lenis'` (UNIQUEMENT dans `core/scroll.ts`). Ne pas importer son CSS.
- Ticker : `import { onTick } from '../core/ticker'` → `onTick((dt, t) => …)` retourne un cleanup.
  N'utilise PAS `requestAnimationFrame` directement ; passe par `onTick`.
- Thème : `import { getTheme, getColors, onThemeChange, toggleTheme } from '../core/theme'`.
  `getColors()` → `{ bg, text, dim, gradA, gradB, line }` (hex/rgba). Re-lis les couleurs sur `onThemeChange`.
- i18n : `import { getLang, t, onLangChange, toggleLang } from '../core/i18n'`. Re-render le texte sur `onLangChange`.
- Son : `import { sound } from '../core/sound'` → `sound.play('hover'|'click'|'open'|'close'|'toggle')`, `sound.toggleMute()`.
- Toast : `import { showToast } from '../core/toast'`.
- Scroll lock : `import { lockScroll, unlockScroll } from '../core/scroll'` (overlays).
- Utils DOM : `import { qs, qsOpt, qsa, el, on, onEl, escapeHtml } from '../utils/dom'`.
- Utils math : `import { lerp, clamp, mapRange, dist, rand, randInt, TAU, smoothNoise } from '../utils/math'`.
- Device : `import { isTouch, prefersReducedMotion, dpr, isCoarsePointer } from '../utils/device'`.
- Données : `import { ui, stack, poles, skills, experiences, projects, nowItems, engagementItems, certifItems } from '../data/content'`.
- Types : `import type { Project, Skill, SkillPole, Experience, NowItem, Lang, Theme, ThemeColors, Cleanup } from '../types'`.

## Localisation
Beaucoup de champs sont `Localized<T>` = `{ fr, en }`. Affiche avec `value[getLang()]` et
ré-affiche dans un handler `onLangChange`.

## Règles transverses
- `prefersReducedMotion()` → fournir un rendu STATIQUE (pas d'anim, canvas dessiné une fois).
- Canvas : gérer `dpr()`, `ResizeObserver`, et pause via `IntersectionObserver` (ne pas dessiner hors écran).
- Chaque fichier exporte EXACTEMENT la signature indiquée. Pas d'export default sauf mention.
- Ne modifie AUCUN autre fichier. N'exécute AUCUNE commande (npm/build/test/install interdits).

## Signatures attendues (consommées par src/main.ts)
- `core/scroll.ts` : `export function initSmoothScroll(): void` ; `export function lockScroll(): void` ; `export function unlockScroll(): void`
- `core/cursor.ts` : `export function initCursor(): void`
- `core/preloader.ts` : `export function runPreloader(onDone: () => void): void`
- `core/palette.ts` : `export function initCommandPalette(): void`
- `core/terminal.ts` : `export function initTerminal(): void` ; `export function openTerminal(): void`
- `core/easter.ts` : `export function initEaster(): void`
- `components/HeroGraph.ts` : `export function initHeroGraph(canvas: HTMLCanvasElement): void`
- `components/SkillsMetaballs.ts` : `export function initSkillsMetaballs(canvas: HTMLCanvasElement): void`
- `components/Timeline.ts` : `export function initTimeline(root: HTMLElement): void`
- `components/projects.ts` : `export function initProjects(grid: HTMLElement): void`
- `components/Marquee.ts` : `export function initMarquee(root: HTMLElement): void`
- `components/MagneticButton.ts` : `export function initMagnetic(): void`
- `components/Counter.ts` : `export function initCounters(): void`
- `components/Clock.ts` : `export function initClock(elClock: HTMLElement): void`
- `components/ContactForm.ts` : `export function initContactForm(form: HTMLFormElement): void`
- `components/CopyEmail.ts` : `export function initCopyEmail(): void`

## Hooks DOM disponibles (index.html)
Voir index.html. Principaux : `#preloader #boot-log #boot-bar #boot-skip`, `#header #progress-bar #nav #burger`,
`#hero-canvas #hero-subtitle[data-typewriter]`, `#stack-marquee`, `[data-counter]`, `#skills-canvas #skills-legend`,
`#timeline`, `#projects-grid`, `#popup-root`, `#now-list #engagement-list #certifs-list`, `#contact-form #form-status`,
`[data-copy-email]`, `#clock #year`, `#palette #palette-input #palette-list [data-palette-close]`,
`#terminal #terminal-out #terminal-input [data-terminal-close]`, `#toast`, `#konami`, `[data-magnetic]`, `[data-external]`.
