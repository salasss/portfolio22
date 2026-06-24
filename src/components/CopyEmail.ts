// Copie d'email au clic sur les liens [data-copy-email] (ancres mailto).
// Utilise l'API Clipboard moderne avec repli execCommand pour les contextes non sécurisés.
import { showToast } from '../core/toast'
import { t } from '../core/i18n'
import { sound } from '../core/sound'
import { qsa } from '../utils/dom'

/** Notifie l'utilisateur + son après une copie réussie. */
function notifyCopied(): void {
  showToast(t('copy.done'))
  sound.play('click')
}

/** Repli pour les navigateurs/contextes sans navigator.clipboard. */
function fallbackCopy(value: string): void {
  const textarea = document.createElement('textarea')
  textarea.value = value
  // Hors flux visuel et non focusable au scroll, tout en restant sélectionnable.
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, value.length)
  try {
    document.execCommand('copy')
  } finally {
    textarea.remove()
  }
  notifyCopied()
}

function copyValue(value: string): void {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(value).then(notifyCopied, () => fallbackCopy(value))
    return
  }
  fallbackCopy(value)
}

export function initCopyEmail(): void {
  for (const node of qsa<HTMLElement>('[data-copy-email]')) {
    node.addEventListener('click', (e) => {
      e.preventDefault()
      const value = node.getAttribute('data-copy-email')
      if (!value) return
      copyValue(value)
    })
  }
}
