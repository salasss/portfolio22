// ============================================================
// main.ts — bootstrap & câblage. Ordre d'init contrôlé ici.
// ============================================================
import './styles/reset.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { gsap, ScrollTrigger } from './core/gsap'
import { startTicker, onTick } from './core/ticker'
import { initTheme, toggleTheme } from './core/theme'
import { initI18n, toggleLang } from './core/i18n'
import { initSound, sound } from './core/sound'
import { initReveals, initTypewriter } from './core/reveal'

// Modules-feuilles (produits par le workflow — voir CONTRACTS).
import { initSmoothScroll } from './core/scroll'
import { initCursor } from './core/cursor'
import { runPreloader } from './core/preloader'
import { initCommandPalette } from './core/palette'
import { initTerminal } from './core/terminal'
import { initEaster } from './core/easter'
import { initHeroGraph } from './components/HeroGraph'
import { initSkillsMetaballs } from './components/SkillsMetaballs'
import { initTimeline } from './components/Timeline'
import { initProjects } from './components/projects'
import { initMarquee } from './components/Marquee'
import { initMagnetic } from './components/MagneticButton'
import { initCounters } from './components/Counter'
import { initClock } from './components/Clock'
import { initContactForm } from './components/ContactForm'
import { initCopyEmail } from './components/CopyEmail'

import { qs, qsOpt, qsa } from './utils/dom'
import { isTouch } from './utils/device'

/* ---------- Chrome : header, progress, nav, burger ---------- */
function initChrome(): void {
  const header = qs('#header')
  const bar = qs('#progress-bar')
  let lastY = 0

  onTick(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const y = window.scrollY
    const p = max > 0 ? y / max : 0
    bar.style.transform = `scaleX(${p})`

    header.classList.toggle('is-scrolled', y > 40)
    // masque le header au scroll down, le ré-affiche au scroll up
    if (y > lastY && y > 300) header.classList.add('is-hidden')
    else header.classList.remove('is-hidden')
    lastY = y
  })

  // Toggles
  qsOpt('#theme-toggle')?.addEventListener('click', () => {
    toggleTheme()
    sound.play('toggle')
  })
  qsOpt('#lang-toggle')?.addEventListener('click', () => {
    toggleLang()
    sound.play('toggle')
  })
  qsOpt('#sound-toggle')?.addEventListener('click', () => sound.toggleMute())

  // Burger (mobile) : ouvre/ferme la nav
  const burger = qsOpt('#burger')
  const nav = qsOpt('#nav')
  burger?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open')
    burger.setAttribute('aria-expanded', String(open))
    if (nav) nav.style.display = open ? 'flex' : ''
  })
  for (const a of qsa('#nav a')) {
    a.addEventListener('click', () => {
      document.body.classList.remove('nav-open')
      if (nav && window.innerWidth <= 900) nav.style.display = ''
    })
  }

  // Nav active via IntersectionObserver
  const links = qsa<HTMLAnchorElement>('#nav a[data-nav]')
  const byId = new Map(links.map((l) => [l.getAttribute('href')?.slice(1) ?? '', l]))
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-active'))
          byId.get(e.target.id)?.classList.add('is-active')
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  for (const sec of qsa('main section[id]')) io.observe(sec)

  // Année footer
  const year = qsOpt('#year')
  if (year) year.textContent = String(new Date().getFullYear())
}

/* ---------- Analytics privacy-first (Plausible, optionnel) ---------- */
function initAnalytics(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN
  if (!domain) return
  const s = document.createElement('script')
  s.defer = true
  s.setAttribute('data-domain', domain)
  s.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(s)
}

/* ---------- Démarrage des modules dépendants du scroll ---------- */
function start(): void {
  initSmoothScroll()
  initReveals()

  const heroCanvas = qsOpt<HTMLCanvasElement>('#hero-canvas')
  if (heroCanvas) initHeroGraph(heroCanvas)

  const skillsCanvas = qsOpt<HTMLCanvasElement>('#skills-canvas')
  if (skillsCanvas) initSkillsMetaballs(skillsCanvas)

  const timeline = qsOpt('#timeline')
  if (timeline) initTimeline(timeline)

  const grid = qsOpt('#projects-grid')
  if (grid) initProjects(grid)

  initCounters()
  initTypewriter()

  // GSAP doit recalculer après injection de contenu dynamique.
  ScrollTrigger.refresh()
}

/* ---------- Boot ---------- */
function boot(): void {
  initTheme()
  initI18n()
  initSound()
  initAnalytics()
  startTicker()

  if (!isTouch()) {
    document.body.classList.add('has-cursor')
    initCursor()
  }

  initChrome()
  initMagnetic()
  initCopyEmail()
  initCommandPalette()
  initTerminal()
  initEaster()

  const marquee = qsOpt('#stack-marquee')
  if (marquee) initMarquee(marquee)
  const clock = qsOpt('#clock')
  if (clock) initClock(clock)
  const form = qsOpt<HTMLFormElement>('#contact-form')
  if (form) initContactForm(form)

  // Réduit le flash : gsap masque rien tant que le preloader couvre l'écran.
  gsap.set('main', { autoAlpha: 1 })

  runPreloader(start)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
