// ============================================================
// Command palette (Cmd/Ctrl + K) — navigation & actions clavier.
// Cible #palette / #palette-input / #palette-list / [data-palette-close].
// ============================================================
import { gsap } from '../core/gsap'
import { toggleTheme } from '../core/theme'
import { getLang, t, toggleLang } from '../core/i18n'
import { sound } from '../core/sound'
import { showToast } from '../core/toast'
import { lockScroll, unlockScroll } from '../core/scroll'
import { openTerminal } from './terminal'
import { qsOpt, qsa, el, escapeHtml } from '../utils/dom'
import { prefersReducedMotion } from '../utils/device'
import type { Lang } from '../types'

const EMAIL = 'alkama.salas.pro@gmail.com'

interface Command {
  /** Libellé bilingue affiché. */
  label: Record<Lang, string>
  /** Indice à droite (catégorie / raccourci). */
  hint: Record<Lang, string>
  run: () => void
}

/** Fait défiler en douceur vers une section par son id. */
function goTo(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

/** Construit la liste des commandes (libellés résolus à l'affichage selon la langue). */
function buildCommands(): Command[] {
  const nav = { fr: 'aller à', en: 'go to' }
  return [
    {
      label: { fr: 'Aller à À propos', en: 'Go to About' },
      hint: nav,
      run: () => goTo('about'),
    },
    {
      label: { fr: 'Aller à Compétences', en: 'Go to Skills' },
      hint: nav,
      run: () => goTo('skills'),
    },
    {
      label: { fr: 'Aller à Projets', en: 'Go to Projects' },
      hint: nav,
      run: () => goTo('projects'),
    },
    {
      label: { fr: 'Aller à Parcours', en: 'Go to Journey' },
      hint: nav,
      run: () => goTo('experience'),
    },
    {
      label: { fr: 'Aller à Contact', en: 'Go to Contact' },
      hint: nav,
      run: () => goTo('contact'),
    },
    {
      label: { fr: 'Basculer le thème', en: 'Toggle theme' },
      hint: { fr: 'thème', en: 'theme' },
      run: () => {
        toggleTheme()
        sound.play('toggle')
      },
    },
    {
      label: { fr: 'Basculer la langue', en: 'Toggle language' },
      hint: { fr: 'langue', en: 'language' },
      run: () => {
        toggleLang()
        sound.play('toggle')
      },
    },
    {
      label: { fr: 'Couper / activer le son', en: 'Mute / unmute sound' },
      hint: { fr: 'son', en: 'sound' },
      run: () => sound.toggleMute(),
    },
    {
      label: { fr: 'Télécharger le CV', en: 'Download résumé' },
      hint: { fr: 'fichier', en: 'file' },
      run: () => qsOpt<HTMLAnchorElement>('#cv-btn')?.click(),
    },
    {
      label: { fr: "Copier l'email", en: 'Copy email' },
      hint: { fr: 'contact', en: 'contact' },
      run: () => {
        void navigator.clipboard
          .writeText(EMAIL)
          .then(() => showToast(t('copy.done')))
          .catch(() => undefined)
      },
    },
    {
      label: { fr: 'Ouvrir le terminal', en: 'Open terminal' },
      hint: { fr: 'sudo', en: 'sudo' },
      run: () => openTerminal(),
    },
  ]
}

export function initCommandPalette(): void {
  const palette = qsOpt('#palette')
  const input = qsOpt<HTMLInputElement>('#palette-input')
  const list = qsOpt<HTMLUListElement>('#palette-list')
  if (!palette || !input || !list) return

  const reduce = prefersReducedMotion()
  let open = false
  let commands: Command[] = []
  /** Indices (dans `commands`) actuellement affichés après filtrage. */
  let filtered: number[] = []
  let active = 0

  /** Rend la liste filtrée et marque l'item actif. */
  function render(): void {
    const lang = getLang()
    const q = input!.value.trim().toLowerCase()

    filtered = commands
      .map((_, i) => i)
      .filter((i) => {
        const cmd = commands[i]
        if (!cmd) return false
        if (!q) return true
        return cmd.label[lang].toLowerCase().includes(q)
      })

    if (active >= filtered.length) active = filtered.length - 1
    if (active < 0) active = 0

    list!.replaceChildren()
    filtered.forEach((cmdIndex, row) => {
      const cmd = commands[cmdIndex]
      if (!cmd) return
      const li = el(
        'li',
        { role: 'option', 'data-row': String(row) },
        `<span>${escapeHtml(cmd.label[lang])}</span><span class="hint">${escapeHtml(cmd.hint[lang])}</span>`,
      )
      if (row === active) li.classList.add('is-active')
      list!.appendChild(li)
    })
  }

  /** Met à jour seulement la classe active (sans tout reconstruire). */
  function highlight(): void {
    const items = qsa<HTMLLIElement>('li', list!)
    items.forEach((li, i) => li.classList.toggle('is-active', i === active))
    const current = items[active]
    current?.scrollIntoView({ block: 'nearest' })
  }

  function move(delta: number): void {
    if (filtered.length === 0) return
    active = (active + delta + filtered.length) % filtered.length
    highlight()
  }

  function runActive(): void {
    const cmdIndex = filtered[active]
    if (cmdIndex === undefined) return
    const cmd = commands[cmdIndex]
    if (!cmd) return
    close()
    cmd.run()
  }

  function openPalette(): void {
    if (open) return
    open = true
    commands = buildCommands() // reconstruit pour la langue courante
    active = 0
    input!.value = ''
    palette!.removeAttribute('hidden')
    lockScroll()
    render()
    input!.focus()
    sound.play('open')
    if (!reduce) {
      gsap.fromTo(
        palette!.querySelector('.palette__panel'),
        { autoAlpha: 0, y: -18, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'expo.out' },
      )
    }
  }

  function close(): void {
    if (!open) return
    open = false
    palette!.setAttribute('hidden', '')
    unlockScroll()
    sound.play('close')
  }

  function toggle(): void {
    if (open) close()
    else openPalette()
  }

  // Raccourci global Cmd/Ctrl + K (toggle) + Escape (close).
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      toggle()
      return
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      close()
    }
  })

  // Navigation / exécution depuis l'input.
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runActive()
    }
  })

  // Filtrage en direct.
  input.addEventListener('input', () => {
    active = 0
    render()
  })

  // Clic sur un item -> exécute.
  list.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    const li = target?.closest('li')
    if (!li) return
    const row = Number(li.getAttribute('data-row'))
    if (Number.isNaN(row)) return
    active = row
    runActive()
  })

  // Fermeture via backdrop / éléments [data-palette-close].
  for (const closer of qsa('[data-palette-close]', palette)) {
    closer.addEventListener('click', () => close())
  }
}
