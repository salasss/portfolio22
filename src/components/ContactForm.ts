// ============================================================
// ContactForm — validation + envoi (endpoint JSON ou fallback mailto).
// Hooks : #contact-form (input[name=name|email|message], input[name=_gotcha],
// button[type=submit] > .form__btn-label, #form-status). Voir index.html.
// ============================================================
import { t } from '../core/i18n'
import { sound } from '../core/sound'
import { qs, qsOpt } from '../utils/dom'

const MAIL_TO = 'alkama.salas.pro@gmail.com'
// Validation email volontairement simple/permissive (la vérité = un round-trip serveur).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Remonte vers la `.form__row` parente d'un champ (peut être null). */
function rowOf(field: Element): HTMLElement | null {
  return field.closest<HTMLElement>('.form__row')
}

function setInvalid(field: Element, invalid: boolean): void {
  rowOf(field)?.classList.toggle('is-invalid', invalid)
}

export function initContactForm(form: HTMLFormElement): void {
  const nameInput = qs<HTMLInputElement>('input[name="name"]', form)
  const emailInput = qs<HTMLInputElement>('input[name="email"]', form)
  const messageInput = qs<HTMLTextAreaElement>('textarea[name="message"]', form)
  const honeypot = qsOpt<HTMLInputElement>('input[name="_gotcha"]', form)
  const submitBtn = qs<HTMLButtonElement>('button[type="submit"]', form)
  const btnLabel = qsOpt('.form__btn-label', submitBtn)
  const status = qsOpt('#form-status')

  const defaultLabel = btnLabel?.textContent ?? t('contact.form.send')
  let sending = false

  function setStatus(text: string, variant?: 'success' | 'error'): void {
    if (!status) return
    status.textContent = text
    status.classList.toggle('is-success', variant === 'success')
    status.classList.toggle('is-error', variant === 'error')
  }

  function setLabel(text: string): void {
    if (btnLabel) btnLabel.textContent = text
    else submitBtn.textContent = text
  }

  // Réinitialise l'état d'erreur d'un champ dès que l'utilisateur retape.
  for (const field of [nameInput, emailInput, messageInput]) {
    field.addEventListener('input', () => setInvalid(field, false))
  }

  /** Valide les champs, marque les `.form__row` invalides, renvoie le 1er champ fautif. */
  function validate(): HTMLElement | null {
    const nameOk = nameInput.value.trim().length > 0
    const emailOk = EMAIL_RE.test(emailInput.value.trim())
    const messageOk = messageInput.value.trim().length > 0

    setInvalid(nameInput, !nameOk)
    setInvalid(emailInput, !emailOk)
    setInvalid(messageInput, !messageOk)

    if (!nameOk) return nameInput
    if (!emailOk) return emailInput
    if (!messageOk) return messageInput
    return null
  }

  async function sendViaEndpoint(
    endpoint: string,
    payload: { name: string; email: string; message: string },
  ): Promise<void> {
    sending = true
    submitBtn.disabled = true
    setLabel(t('contact.form.sending'))
    setStatus(t('contact.form.sending'))

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus(t('contact.form.success'), 'success')
        form.reset()
        sound.play('click')
      } else {
        setStatus(t('contact.form.error'), 'error')
      }
    } catch {
      setStatus(t('contact.form.error'), 'error')
    } finally {
      sending = false
      submitBtn.disabled = false
      setLabel(defaultLabel)
    }
  }

  function sendViaMailto(payload: { name: string; email: string; message: string }): void {
    const subject = encodeURIComponent(`Portfolio — ${payload.name}`)
    const body = encodeURIComponent(
      `${payload.message}\n\n— ${payload.name} <${payload.email}>`,
    )
    setStatus(t('contact.form.success'), 'success')
    window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`
  }

  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault()
    if (sending) return

    // Honeypot : un bot a rempli le champ caché -> succès silencieux, rien n'est envoyé.
    if (honeypot && honeypot.value.trim() !== '') {
      setStatus(t('contact.form.success'), 'success')
      form.reset()
      return
    }

    const firstInvalid = validate()
    if (firstInvalid) {
      firstInvalid.focus()
      return
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
    }

    const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT
    if (endpoint) {
      void sendViaEndpoint(endpoint, payload)
    } else {
      sendViaMailto(payload)
    }
  })
}
