// ============================================================
// easter.ts — console art + Konami code (pluie de chips).
// Export : initEaster(): void
// ============================================================
import { gsap } from '../core/gsap'
import { showToast } from '../core/toast'
import { rand, randInt, pick } from '../utils/math'
import { stack } from '../data/content'
import { prefersReducedMotion } from '../utils/device'

/* ---------- Console art (au boot) ---------- */
function printConsoleArt(): void {
  // Petit bloc ASCII du nom (style "banner" compact, lisible en console).
  const banner = [
    '',
    '  ███████╗ █████╗ ██╗      █████╗ ███████╗   █████╗ ██╗     ██╗  ██╗ █████╗ ███╗   ███╗ █████╗',
    '  ██╔════╝██╔══██╗██║     ██╔══██╗██╔════╝  ██╔══██╗██║     ██║ ██╔╝██╔══██╗████╗ ████║██╔══██╗',
    '  ███████╗███████║██║     ███████║███████╗  ███████║██║     █████╔╝ ███████║██╔████╔██║███████║',
    '  ╚════██║██╔══██║██║     ██╔══██║╚════██║  ██╔══██║██║     ██╔═██╗ ██╔══██║██║╚██╔╝██║██╔══██║',
    '  ███████║██║  ██║███████╗██║  ██║███████║  ██║  ██║███████╗██║  ██╗██║  ██║██║ ╚═╝ ██║██║  ██║',
    '  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝',
    '',
  ].join('\n')

  const bannerStyle = [
    'color: #8b5cf6',
    'font-family: monospace',
    'font-size: 11px',
    'line-height: 1.15',
    'text-shadow: 0 0 12px rgba(139,92,246,.45)',
  ].join(';')

  const leadStyle = [
    'color: #fb7185',
    'font-family: monospace',
    'font-size: 13px',
    'font-weight: 700',
    'padding: 2px 0',
  ].join(';')

  const dimStyle = ['color: #f59e0b', 'font-family: monospace', 'font-size: 12px'].join(';')

  // %c applique chaque style au segment qui le suit.
  // eslint-disable-next-line no-console
  console.log(`%c${banner}`, bannerStyle)
  // eslint-disable-next-line no-console
  console.log('%cTu lis ceci ? Écris-moi → alkama.salas.pro@gmail.com', leadStyle)
  // eslint-disable-next-line no-console
  console.log("%ctape 'sudo' n'importe où pour le terminal", dimStyle)
}

/* ---------- Konami code ---------- */
const KONAMI: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

const CHIP_COUNT = 24

/** Pluie de chips : crée des div.konami__chip et les fait tomber via GSAP. */
function rainChips(layer: HTMLElement): void {
  for (let i = 0; i < CHIP_COUNT; i++) {
    const chip = document.createElement('div')
    chip.className = 'konami__chip'
    chip.textContent = pick(stack)

    chip.style.left = `${rand(0, 96)}%`
    chip.style.fontSize = `${randInt(14, 40)}px`

    layer.appendChild(chip)

    gsap.fromTo(
      chip,
      { yPercent: -10, rotation: rand(-90, 90), opacity: 0 },
      {
        // De juste au-dessus de l'écran jusqu'en bas (110vh sous le top: -10%).
        y: () => window.innerHeight * 1.2,
        rotation: `+=${rand(-360, 360)}`,
        opacity: 0.9,
        ease: 'none',
        duration: rand(2.5, 4),
        delay: rand(0, 1.2),
        onComplete: () => chip.remove(),
      },
    )
  }
}

/* ---------- Entrée publique ---------- */
export function initEaster(): void {
  printConsoleArt()

  const layer = document.getElementById('konami')

  let progress = 0

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ignore la frappe quand l'utilisateur tape dans un champ.
    const target = e.target
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return
    }

    const expected = KONAMI[progress]
    if (expected === undefined) {
      progress = 0
      return
    }

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (key === expected) {
      progress++
      if (progress >= KONAMI.length) {
        progress = 0
        unlock(layer)
      }
    } else {
      // Reprend à 1 si la touche correspond au tout début de la séquence.
      progress = key === KONAMI[0] ? 1 : 0
    }
  })
}

function unlock(layer: HTMLElement | null): void {
  showToast('🎮 cheat unlocked')

  // Rendu statique : pas d'animation si l'utilisateur préfère le mouvement réduit.
  if (prefersReducedMotion() || !layer) return

  rainChips(layer)
}
