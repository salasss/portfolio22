// ============================================================
// Clock.ts — horloge temps réel de Paris (footer).
// Affiche l'heure Europe/Paris au format HH:MM:SS, mise à jour
// chaque seconde. Pas de cleanup nécessaire (vit toute la page).
// ============================================================

/** Formateur figé : l'heure de Paris en 24h, deux chiffres partout. */
const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

/**
 * Démarre l'horloge de Paris sur l'élément fourni.
 * Met à jour `textContent` immédiatement puis toutes les secondes.
 */
export function initClock(elClock: HTMLElement): void {
  const tick = (): void => {
    elClock.textContent = parisFormatter.format(new Date())
  }

  tick()
  window.setInterval(tick, 1000)
}
