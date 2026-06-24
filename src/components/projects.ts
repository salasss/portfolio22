// ============================================================
// projects.ts — grille de projets + popups in-page.
// Cartes .project-card (tilt 3D + spotlight), ouverture d'une
// popup détaillée dans #popup-root (focus trap, hash, i18n).
// Drag-to-scroll horizontal de la grille.
// Anime via GSAP, respecte prefers-reduced-motion & pointeur grossier.
// ============================================================
import { gsap } from '../core/gsap'
import { projects } from '../data/content'
import { getLang, onLangChange } from '../core/i18n'
import { lockScroll, unlockScroll } from '../core/scroll'
import { sound } from '../core/sound'
import { el, escapeHtml, onEl } from '../utils/dom'
import { clamp } from '../utils/math'
import { isCoarsePointer, prefersReducedMotion } from '../utils/device'
import type { Project } from '../types'

/* ---------- Réglages tilt / spotlight ---------- */
const MAX_TILT = 6 // degrés (rotateX/rotateY)
const HOVER_SCALE = 1.02
/** Seuil de déplacement (px) au-delà duquel un pointerdown devient un drag (pas un clic). */
const DRAG_THRESHOLD = 6
/** Durée de la transition de fermeture CSS (cf. .popup__panel) avant de vider le DOM. */
const CLOSE_DELAY = 500

/* ---------- État popup partagé ---------- */
let activeProject: Project | null = null
/** Carte d'origine, pour restaurer le focus à la fermeture. */
let originCard: HTMLElement | null = null
let closeTimer = 0
/** Désabonnements liés à la popup ouverte (Escape, focus trap, clics). */
let popupCleanups: Array<() => void> = []

/**
 * Rend la grille de projets et câble interactions + popup.
 */
export function initProjects(grid: HTMLElement): void {
  renderCards(grid)
  enableDragScroll(grid)

  onLangChange(() => {
    renderCards(grid)
    // Si une popup est ouverte, on reconstruit son contenu dans la nouvelle langue.
    if (activeProject) renderPopup(activeProject)
  })

  // Deep-link : #projet/<id> au boot ouvre la popup correspondante.
  openFromHash()
  onEl(window, 'hashchange', () => {
    const id = parseHash()
    if (id && (!activeProject || activeProject.id !== id)) openFromHash()
    else if (!id && activeProject) closePopup()
  })
}

/* ============================================================
   CARTES
   ============================================================ */
function renderCards(grid: HTMLElement): void {
  const lang = getLang()
  grid.textContent = ''

  for (const project of projects) {
    const card = el('article', {
      class: 'project-card',
      tabindex: '0',
      role: 'button',
      'data-project': project.id,
      'aria-label': `${project.title} — ${project.tagline[lang]}`,
    })

    const tagsHtml = project.stack
      .slice(0, 5)
      .map((s) => `<span class="tag">${escapeHtml(s)}</span>`)
      .join('')

    card.innerHTML = `
      <span class="project-card__view mono">VIEW</span>
      <span class="project-card__index">${escapeHtml(project.index)}</span>
      <div>
        <h3 class="project-card__title">${escapeHtml(project.title)}</h3>
        <p class="project-card__tagline">${escapeHtml(project.tagline[lang])}</p>
      </div>
      <div class="project-card__tags">${tagsHtml}</div>
    `

    attachTilt(card)
    attachActivation(card, project)
    grid.appendChild(card)
  }
}

/** Ouvre la popup au clic / Enter / Espace (skip si on vient de drag). */
function attachActivation(card: HTMLElement, project: Project): void {
  onEl(card, 'click', () => {
    if (card.dataset.dragging === '1') return
    openPopup(project, card)
  })

  onEl(card, 'keydown', (e) => {
    const ev = e as KeyboardEvent
    if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
      ev.preventDefault()
      openPopup(project, card)
    }
  })
}

/* ---------- Tilt 3D + spotlight ---------- */
function attachTilt(card: HTMLElement): void {
  if (isCoarsePointer() || prefersReducedMotion()) return

  onEl(card, 'pointermove', (e) => {
    const ev = e as PointerEvent
    const rect = card.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const px = clamp((ev.clientX - rect.left) / rect.width, 0, 1)
    const py = clamp((ev.clientY - rect.top) / rect.height, 0, 1)

    // Spotlight (consommé par .project-card::before).
    card.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`)
    card.style.setProperty('--my', `${(py * 100).toFixed(2)}%`)

    // Tilt : haut -> rotateX positif, gauche -> rotateY négatif (faible).
    const rotX = (0.5 - py) * (MAX_TILT * 2)
    const rotY = (px - 0.5) * (MAX_TILT * 2)
    card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${HOVER_SCALE})`
  })

  const reset = (): void => {
    card.style.transform = ''
    card.style.removeProperty('--mx')
    card.style.removeProperty('--my')
  }
  onEl(card, 'pointerleave', reset)
  onEl(card, 'blur', reset)
}

/* ---------- Drag-to-scroll horizontal ---------- */
function enableDragScroll(grid: HTMLElement): void {
  let active = false
  let startX = 0
  let startScroll = 0
  let pointerId = -1

  onEl(grid, 'pointerdown', (e) => {
    const ev = e as PointerEvent
    // Seuls les pointeurs primaires (souris gauche / un doigt).
    if (ev.button !== 0 && ev.pointerType === 'mouse') return
    active = true
    startX = ev.clientX
    startScroll = grid.scrollLeft
    pointerId = ev.pointerId
    // On marque toutes les cartes comme « pas en drag » au départ.
    for (const card of Array.from(grid.children)) {
      if (card instanceof HTMLElement) delete card.dataset.dragging
    }
  })

  onEl(grid, 'pointermove', (e) => {
    if (!active) return
    const ev = e as PointerEvent
    const dx = ev.clientX - startX
    if (Math.abs(dx) > DRAG_THRESHOLD) {
      grid.scrollLeft = startScroll - dx
      // Marque la carte survolée comme en drag pour neutraliser le clic.
      const target = (ev.target as Element | null)?.closest('.project-card')
      if (target instanceof HTMLElement) target.dataset.dragging = '1'
      // Capture pour continuer à suivre hors de la grille.
      if (pointerId !== -1 && !grid.hasPointerCapture(pointerId)) {
        try {
          grid.setPointerCapture(pointerId)
        } catch {
          // pointerId invalide (relâché) : on ignore.
        }
      }
    }
  })

  const end = (): void => {
    active = false
    if (pointerId !== -1) {
      try {
        grid.releasePointerCapture(pointerId)
      } catch {
        // déjà relâché : rien à faire.
      }
      pointerId = -1
    }
    // Le flag dragging est lu par le handler click (qui se déclenche juste après),
    // puis nettoyé au prochain pointerdown — pas besoin de l'effacer ici.
  }
  onEl(grid, 'pointerup', end)
  onEl(grid, 'pointercancel', end)
}

/* ============================================================
   POPUP
   ============================================================ */
function openPopup(project: Project, card: HTMLElement): void {
  const root = document.getElementById('popup-root')
  if (!root) return

  window.clearTimeout(closeTimer)
  teardownPopup()

  activeProject = project
  originCard = card

  renderPopup(project)
  root.classList.add('is-open')
  lockScroll()
  sound.play('open')

  history.replaceState(null, '', `#projet/${project.id}`)

  // Focus trap : focus le bouton close, piège Tab dans le panel.
  const panel = root.querySelector<HTMLElement>('.popup__panel')
  const closeBtn = root.querySelector<HTMLElement>('.popup__close')
  closeBtn?.focus()

  if (panel) {
    popupCleanups.push(
      onEl(panel, 'keydown', (e) => trapTab(e as KeyboardEvent, panel)),
    )
  }

  // Escape global.
  popupCleanups.push(
    onEl(document, 'keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') closePopup()
    }),
  )

  // Clic backdrop / bouton close.
  const backdrop = root.querySelector<HTMLElement>('.popup__backdrop')
  if (backdrop) popupCleanups.push(onEl(backdrop, 'click', () => closePopup()))
  if (closeBtn) popupCleanups.push(onEl(closeBtn, 'click', () => closePopup()))
}

function closePopup(): void {
  const root = document.getElementById('popup-root')
  if (!root || !activeProject) return

  root.classList.remove('is-open')
  unlockScroll()
  sound.play('close')
  history.replaceState(null, '', '#')

  teardownPopup()

  const card = originCard
  originCard = null
  activeProject = null

  // Restaure le focus sur la carte d'origine.
  card?.focus()

  // Vide le DOM de la popup après la transition de sortie.
  window.clearTimeout(closeTimer)
  closeTimer = window.setTimeout(() => {
    if (!activeProject) root.textContent = ''
  }, CLOSE_DELAY)
}

/** Construit / reconstruit le contenu de la popup pour `project`. */
function renderPopup(project: Project): void {
  const root = document.getElementById('popup-root')
  if (!root) return
  const lang = getLang()

  const labels =
    lang === 'fr'
      ? { problem: 'Problème', solution: 'Solution', work: 'Réalisations', stack: 'Stack', links: 'Liens', priv: 'repo privé' }
      : { problem: 'Problem', solution: 'Solution', work: 'Highlights', stack: 'Stack', links: 'Links', priv: 'private repo' }

  const bullets = project.bullets[lang]
  const bulletsHtml = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')
  const tagsHtml = project.stack.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')

  const links: string[] = []
  if (project.github) {
    links.push(
      `<a class="btn" href="${escapeHtml(project.github)}" target="_blank" rel="noopener" data-external data-magnetic>GitHub ↗</a>`,
    )
  }
  if (project.demo) {
    links.push(
      `<a class="btn" href="${escapeHtml(project.demo)}" target="_blank" rel="noopener" data-external data-magnetic>${
        lang === 'fr' ? 'Démo' : 'Demo'
      } ↗</a>`,
    )
  }
  if (links.length === 0) links.push(`<span class="tag">${escapeHtml(labels.priv)}</span>`)

  root.innerHTML = `
    <div class="popup__backdrop"></div>
    <div class="popup__panel" role="dialog" aria-modal="true" aria-labelledby="popup-title">
      <button class="popup__close" type="button" aria-label="${lang === 'fr' ? 'Fermer' : 'Close'}">×</button>
      <span class="popup__index">${escapeHtml(project.index)}</span>
      <h2 class="popup__title" id="popup-title">${escapeHtml(project.title)}</h2>
      <p class="popup__role">${escapeHtml(project.role[lang])}</p>

      <div class="popup__section">
        <h4>${escapeHtml(labels.problem)}</h4>
        <p>${escapeHtml(project.problem[lang])}</p>
      </div>
      <div class="popup__section">
        <h4>${escapeHtml(labels.solution)}</h4>
        <p>${escapeHtml(project.solution[lang])}</p>
      </div>
      <div class="popup__section">
        <h4>${escapeHtml(labels.work)}</h4>
        <ul class="popup__bullets">${bulletsHtml}</ul>
      </div>
      <div class="popup__section">
        <h4>${escapeHtml(labels.stack)}</h4>
        <div class="popup__tags">${tagsHtml}</div>
      </div>
      <div class="popup__section">
        <h4>${escapeHtml(labels.links)}</h4>
        <div class="popup__links">${links.join('')}</div>
      </div>
    </div>
  `

  // Re-câble les handlers de la popup si elle est déjà ouverte (re-render i18n).
  if (root.classList.contains('is-open')) rebindOpenPopup(root)

  // Anim d'entrée du panel (CSS gère le fondu, on ajoute un léger lift au contenu).
  if (!prefersReducedMotion()) {
    const sections = root.querySelectorAll<HTMLElement>('.popup__section')
    if (sections.length) {
      gsap.from(sections, { y: 14, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'expo.out', delay: 0.1 })
    }
  }
}

/** Re-attache Escape / backdrop / close / trap après un re-render (changement de langue). */
function rebindOpenPopup(root: HTMLElement): void {
  for (const fn of popupCleanups) fn()
  popupCleanups = []

  const panel = root.querySelector<HTMLElement>('.popup__panel')
  const backdrop = root.querySelector<HTMLElement>('.popup__backdrop')
  const closeBtn = root.querySelector<HTMLElement>('.popup__close')

  if (panel) popupCleanups.push(onEl(panel, 'keydown', (e) => trapTab(e as KeyboardEvent, panel)))
  popupCleanups.push(
    onEl(document, 'keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Escape') closePopup()
    }),
  )
  if (backdrop) popupCleanups.push(onEl(backdrop, 'click', () => closePopup()))
  if (closeBtn) popupCleanups.push(onEl(closeBtn, 'click', () => closePopup()))
}

function teardownPopup(): void {
  for (const fn of popupCleanups) fn()
  popupCleanups = []
}

/** Piège la tabulation à l'intérieur du panel (focus trap accessibilité). */
function trapTab(ev: KeyboardEvent, panel: HTMLElement): void {
  if (ev.key !== 'Tab') return
  const focusables = Array.from(
    panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((node) => node.offsetParent !== null || node === document.activeElement)

  if (focusables.length === 0) {
    ev.preventDefault()
    return
  }
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!first || !last) return

  const current = document.activeElement
  if (ev.shiftKey) {
    if (current === first || !panel.contains(current)) {
      ev.preventDefault()
      last.focus()
    }
  } else if (current === last) {
    ev.preventDefault()
    first.focus()
  }
}

/* ---------- Deep-link hash ---------- */
function parseHash(): string | null {
  const m = /^#projet\/([\w-]+)$/.exec(location.hash)
  const id = m?.[1]
  return id ?? null
}

function openFromHash(): void {
  const id = parseHash()
  if (!id) return
  const project = projects.find((p) => p.id === id)
  if (!project) return
  const card = document.querySelector<HTMLElement>(`.project-card[data-project="${CSS.escape(id)}"]`)
  if (card) openPopup(project, card)
}
