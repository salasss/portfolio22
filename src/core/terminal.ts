// ============================================================
// terminal.ts — mini-terminal "sudo" : easter-egg interactif.
// Tape "sudo" n'importe où (hors champ texte) pour l'ouvrir.
// ============================================================
import { qsOpt, qsa, escapeHtml, onEl, on } from '../utils/dom'
import { projects } from '../data/content'
import { toggleTheme } from '../core/theme'
import { toggleLang } from '../core/i18n'
import { lockScroll, unlockScroll } from '../core/scroll'
import { sound } from '../core/sound'

const TRIGGER = 'sudo'

/** Liste des commandes (sert au `help` et à l'autocomplétion). */
const COMMANDS: readonly string[] = [
  'help',
  'whoami',
  'ls projects',
  'cat cv',
  'theme',
  'lang',
  'contact',
  'clear',
  'exit',
  'close',
]

let bound = false
let isOpen = false

let panel: HTMLElement | null = null
let out: HTMLElement | null = null
let input: HTMLInputElement | null = null

/** Buffer des dernières touches alphabétiques (détection du mot déclencheur). */
let keyBuffer = ''

/** Historique des commandes saisies (pour ArrowUp/Down). */
const history: string[] = []
let historyIndex = -1

/* ---------- Helpers DOM ---------- */

function ensureRefs(): boolean {
  if (!panel) panel = qsOpt('#terminal')
  if (!out) out = qsOpt('#terminal-out')
  if (!input) input = qsOpt<HTMLInputElement>('#terminal-input')
  return Boolean(panel && out && input)
}

/** Ajoute une ligne (HTML déjà sûr) au flux et scrolle en bas. */
function write(html: string): void {
  if (!out) return
  const line = document.createElement('div')
  line.innerHTML = html
  out.appendChild(line)
  out.scrollTop = out.scrollHeight
}

/** Écho de la commande saisie, façon prompt. */
function echo(command: string): void {
  write(`<span class="dim">$</span> ${escapeHtml(command)}`)
}

function clearOut(): void {
  if (out) out.textContent = ''
}

/* ---------- Commandes ---------- */

function cmdHelp(): void {
  write('<span class="dim">commandes disponibles —</span>')
  const lines: Record<string, string> = {
    help: 'cette aide',
    whoami: 'qui suis-je',
    'ls projects': 'liste les projets',
    'cat cv': 'télécharge le CV',
    theme: 'bascule clair / sombre',
    lang: 'bascule FR / EN',
    contact: 'va à la section contact',
    clear: 'efface le terminal',
    'exit / close': 'ferme le terminal',
  }
  for (const [name, desc] of Object.entries(lines)) {
    write(`<span class="ok">${escapeHtml(name)}</span><span class="dim"> — ${escapeHtml(desc)}</span>`)
  }
}

function cmdWhoami(): void {
  write('<span class="ok">salas alkama</span> <span class="dim">— cloud / devops / devsecops engineer</span>')
}

function cmdLsProjects(): void {
  if (projects.length === 0) {
    write('<span class="dim">aucun projet.</span>')
    return
  }
  for (const p of projects) {
    write(`<span class="dim">${escapeHtml(p.id)}</span>  <span class="ok">${escapeHtml(p.title)}</span>`)
  }
}

function cmdCatCv(): void {
  const cv = qsOpt<HTMLAnchorElement>('#cv-btn')
  if (cv) {
    cv.click()
    write('<span class="dim">downloading CV…</span>')
  } else {
    write('<span class="err">cv: not found</span>')
  }
}

function cmdTheme(): void {
  toggleTheme()
  write('<span class="ok">theme switched</span>')
}

function cmdLang(): void {
  toggleLang()
  write('<span class="ok">lang switched</span>')
}

function cmdContact(): void {
  write('<span class="dim">→ contact</span>')
  const target = qsOpt('#contact')
  close()
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  else window.location.hash = '#contact'
}

function cmdUnknown(name: string): void {
  write(`<span class="err">command not found: ${escapeHtml(name)}</span> <span class="dim">— tape 'help'</span>`)
}

/** Exécute la ligne saisie. */
function run(raw: string): void {
  const command = raw.trim()
  if (command === '') return

  echo(command)
  if (history[history.length - 1] !== command) history.push(command)
  historyIndex = history.length

  const normalized = command.replace(/\s+/g, ' ').toLowerCase()

  switch (normalized) {
    case 'help':
      cmdHelp()
      break
    case 'whoami':
      cmdWhoami()
      break
    case 'ls projects':
    case 'ls':
      cmdLsProjects()
      break
    case 'cat cv':
      cmdCatCv()
      break
    case 'theme':
      cmdTheme()
      break
    case 'lang':
      cmdLang()
      break
    case 'contact':
      cmdContact()
      break
    case 'clear':
    case 'cls':
      clearOut()
      break
    case 'exit':
    case 'close':
    case 'quit':
      close()
      break
    default: {
      const first = normalized.split(' ')[0] ?? normalized
      cmdUnknown(first)
    }
  }
}

/* ---------- Historique & autocomplétion ---------- */

function recallHistory(direction: -1 | 1): void {
  if (!input || history.length === 0) return
  historyIndex = Math.min(Math.max(historyIndex + direction, 0), history.length)
  const value = historyIndex >= history.length ? '' : (history[historyIndex] ?? '')
  input.value = value
  // place le curseur en fin de ligne
  const len = value.length
  input.setSelectionRange(len, len)
}

function autocomplete(): void {
  if (!input) return
  const prefix = input.value.toLowerCase()
  if (prefix === '') return
  const matches = COMMANDS.filter((c) => c.startsWith(prefix))
  const first = matches[0]
  if (first === undefined) return
  if (matches.length === 1) {
    input.value = first
  } else {
    // plusieurs candidats : complète le plus long préfixe commun + propose la liste
    input.value = commonPrefix(matches)
    write(`<span class="dim">${escapeHtml(matches.join('   '))}</span>`)
  }
}

function commonPrefix(items: string[]): string {
  const first = items[0]
  if (first === undefined) return ''
  let prefix = first
  for (const item of items) {
    while (!item.startsWith(prefix)) {
      prefix = prefix.slice(0, -1)
      if (prefix === '') return ''
    }
  }
  return prefix
}

/* ---------- Ouverture / fermeture ---------- */

export function openTerminal(): void {
  if (isOpen || !ensureRefs() || !panel || !input || !out) return
  isOpen = true
  keyBuffer = ''
  panel.hidden = false
  lockScroll()
  sound.play('open')

  if (out.childElementCount === 0) {
    write('<span class="ok">guest@salas</span><span class="dim">:~$ sudo — accès accordé.</span>')
    write("<span class=\"dim\">tape 'help' pour la liste des commandes.</span>")
  }

  historyIndex = history.length
  input.value = ''
  input.focus()
}

function close(): void {
  if (!isOpen || !panel) return
  isOpen = false
  panel.hidden = true
  unlockScroll()
  sound.play('close')
}

/* ---------- Bind clavier ---------- */

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function onGlobalKeydown(e: KeyboardEvent): void {
  if (isOpen) return
  // ignore la frappe dans un champ de saisie
  if (isEditableTarget(e.target)) return
  // on ne s'intéresse qu'aux lettres simples (sans modificateur)
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return

  keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-TRIGGER.length)
  if (keyBuffer === TRIGGER) {
    keyBuffer = ''
    openTerminal()
  }
}

function onInputKeydown(e: KeyboardEvent): void {
  if (!input) return
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      run(input.value)
      input.value = ''
      break
    case 'ArrowUp':
      e.preventDefault()
      recallHistory(-1)
      break
    case 'ArrowDown':
      e.preventDefault()
      recallHistory(1)
      break
    case 'Tab':
      e.preventDefault()
      autocomplete()
      break
    case 'Escape':
      e.preventDefault()
      close()
      break
    default:
      break
  }
}

/* ---------- Init ---------- */

export function initTerminal(): void {
  if (bound) return
  if (!ensureRefs() || !input) return
  bound = true

  on(window, 'keydown', onGlobalKeydown)
  onEl(input, 'keydown', (e) => onInputKeydown(e as KeyboardEvent))

  for (const closer of qsa('[data-terminal-close]')) {
    onEl(closer, 'click', () => close())
  }
}
