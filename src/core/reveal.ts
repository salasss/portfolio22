// Reveals au scroll : split en lignes (maison, sans plugin payant) + fondus.
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from '../utils/device'
import { qsa } from '../utils/dom'

/** Découpe le texte d'un élément en lignes animables (.split-line > .split-word). */
function splitLines(host: HTMLElement): HTMLElement[] {
  const text = host.dataset.splitText ?? host.textContent ?? ''
  host.dataset.splitText = text
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return []

  // 1) mesure : on pose des spans temporaires inline-block.
  host.textContent = ''
  const tmp: HTMLElement[] = []
  words.forEach((w, i) => {
    const s = document.createElement('span')
    s.textContent = w
    s.style.display = 'inline-block'
    host.appendChild(s)
    tmp.push(s)
    if (i < words.length - 1) host.appendChild(document.createTextNode(' '))
  })

  // 2) regroupe par ligne (même offsetTop).
  const lines: string[][] = []
  let lastTop: number | null = null
  tmp.forEach((span, i) => {
    const top = span.offsetTop
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      lines.push([])
      lastTop = top
    }
    const word = words[i]
    const current = lines[lines.length - 1]
    if (word && current) current.push(word)
  })

  // 3) reconstruit la structure animable.
  host.textContent = ''
  const inners: HTMLElement[] = []
  for (const lineWords of lines) {
    const line = document.createElement('span')
    line.className = 'split-line'
    const inner = document.createElement('span')
    inner.className = 'split-word'
    inner.textContent = lineWords.join(' ')
    line.appendChild(inner)
    host.appendChild(line)
    inners.push(inner)
  }
  return inners
}

export function initReveals(): void {
  const reduced = prefersReducedMotion()

  // Titres : reveal ligne par ligne.
  for (const host of qsa<HTMLElement>('[data-split]')) {
    if (reduced) continue
    const inners = splitLines(host)
    gsap.from(inners, {
      yPercent: 115,
      opacity: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: host, start: 'top 88%' },
    })
  }

  // Paragraphes / éléments simples : fondu montant.
  for (const host of qsa<HTMLElement>('[data-reveal]')) {
    if (reduced) continue
    gsap.from(host, {
      y: 32,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: host, start: 'top 90%' },
    })
  }

  ScrollTrigger.refresh()
}

/** Effet machine à écrire (hero subtitle). */
export function typeOut(host: HTMLElement, text: string, speed = 45): void {
  if (prefersReducedMotion()) {
    host.textContent = text
    return
  }
  host.textContent = ''
  let i = 0
  const step = () => {
    i++
    host.textContent = text.slice(0, i)
    if (i < text.length) window.setTimeout(step, speed)
  }
  step()
}

/** Lance les machines à écrire ([data-typewriter]). */
export function initTypewriter(): void {
  for (const host of qsa<HTMLElement>('[data-typewriter]')) {
    const text = host.getAttribute('data-typewriter') ?? ''
    typeOut(host, text)
  }
}
