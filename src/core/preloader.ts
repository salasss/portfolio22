// ============================================================
// preloader.ts — boot terminal + wipe d'entrée.
// Tape progressivement un faux log de déploiement, anime la
// barre de progression, puis « wipe » l'écran. onDone() est
// déclenché au tout début du wipe pour que le contenu s'anime
// pendant la transition — et garanti appelé EXACTEMENT une fois.
// ============================================================
import { gsap } from './gsap'
import { onTick } from './ticker'
import { qsOpt, onEl } from '../utils/dom'
import { prefersReducedMotion } from '../utils/device'
import type { Cleanup } from '../types'

const BOOTED_KEY = 'sa.booted'

/** Une ligne du log de boot. `cmd` = commande tapée, `ok` = étape réussie. */
interface BootLine {
  text: string
  kind: 'cmd' | 'ok' | 'plain'
}

const LINES: readonly BootLine[] = [
  { text: '$ terraform init', kind: 'cmd' },
  { text: '  ✓ providers ready', kind: 'ok' },
  { text: '$ kubectl apply -f .', kind: 'cmd' },
  { text: '  ✓ 6 services ready', kind: 'ok' },
  { text: '$ docker compose up', kind: 'cmd' },
  { text: '  ✓ containers healthy', kind: 'ok' },
  { text: '$ building portfolio…', kind: 'cmd' },
]

/** Wrappe une ligne dans le span de couleur attendu par le CSS. */
function renderLine(line: BootLine): string {
  if (line.kind === 'cmd') return `<span class="cmd">${line.text}</span>`
  if (line.kind === 'ok') return `<span class="ok">${line.text}</span>`
  return line.text
}

/** Lit/écrit la session sans casser si le storage est indisponible. */
function readBooted(): boolean {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === '1'
  } catch {
    return false
  }
}
function markBooted(): void {
  try {
    sessionStorage.setItem(BOOTED_KEY, '1')
  } catch {
    /* storage indisponible (mode privé strict) — sans incidence */
  }
}

export function runPreloader(onDone: () => void): void {
  const preloader = qsOpt<HTMLElement>('#preloader')
  const log = qsOpt<HTMLPreElement>('#boot-log')
  const bar = qsOpt<HTMLElement>('#boot-bar')
  const skip = qsOpt<HTMLButtonElement>('#boot-skip')

  // Garantit que onDone() ne part qu'une seule fois.
  let doneCalled = false
  const onDoneOnce = (): void => {
    if (doneCalled) return
    doneCalled = true
    onDone()
  }

  // Hook DOM absent (ou déjà bouté / reduced motion) : on déclenche tout de suite.
  if (!preloader) {
    onDoneOnce()
    return
  }

  const hideInstant = (): void => {
    preloader.classList.add('is-done')
    preloader.style.display = 'none'
    onDoneOnce()
  }

  if (readBooted() || prefersReducedMotion()) {
    hideInstant()
    return
  }

  // ---------- Animation de boot ----------
  let finished = false
  let stopTick: Cleanup | null = null
  let offSkip: Cleanup | null = null
  let offKey: Cleanup | null = null

  const cleanup = (): void => {
    if (stopTick) {
      stopTick()
      stopTick = null
    }
    if (offSkip) {
      offSkip()
      offSkip = null
    }
    if (offKey) {
      offKey()
      offKey = null
    }
  }

  const finish = (): void => {
    if (finished) return
    finished = true
    cleanup()
    markBooted()

    // Complète visuellement la barre avant le wipe.
    if (bar) gsap.set(bar, { width: '100%' })

    gsap.to(preloader, {
      yPercent: -100,
      duration: 0.8,
      ease: 'expo.inOut',
      // onStart : le contenu commence à s'animer pendant que le voile remonte.
      onStart: onDoneOnce,
      onComplete: () => {
        preloader.classList.add('is-done')
        preloader.style.display = 'none'
      },
    })
  }

  // Skip / clavier -> termine immédiatement.
  if (skip) offSkip = onEl(skip, 'click', () => finish())
  offKey = onEl(window, 'keydown', (e: Event) => {
    const ke = e as KeyboardEvent
    if (ke.key === 'Escape' || ke.key === 'Enter') {
      ke.preventDefault()
      finish()
    }
  })

  // Barre de progression 0% -> 100% sur ~la durée du log.
  const TOTAL = 1.4 // s
  if (bar) {
    gsap.fromTo(
      bar,
      { width: '0%' },
      { width: '100%', duration: TOTAL, ease: 'power1.inOut' },
    )
  }

  // Frappe progressive des lignes via le ticker partagé.
  let acc = 0
  let shown = 0
  const stepDelay = TOTAL / LINES.length

  const renderLog = (): void => {
    if (!log) return
    log.innerHTML = LINES.slice(0, shown).map(renderLine).join('\n')
  }

  stopTick = onTick((dt) => {
    if (finished) return
    acc += dt
    while (shown < LINES.length && acc >= stepDelay * (shown + 1)) {
      shown += 1
      renderLog()
    }
    if (shown >= LINES.length && acc >= TOTAL) {
      finish()
    }
  })
}
