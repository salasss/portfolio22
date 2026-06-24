// Toast minimaliste partagé (copie email, statut formulaire, etc.).
let timer = 0

export function showToast(msg: string): void {
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.classList.add('is-visible')
  window.clearTimeout(timer)
  timer = window.setTimeout(() => t.classList.remove('is-visible'), 2200)
}
