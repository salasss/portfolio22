// ============================================================
// Timeline.ts — parcours / expériences pro (#experience).
// Barre de progression dégradée liée au scroll + reveal des items.
// ============================================================
import { gsap, ScrollTrigger } from '../core/gsap'
import { getLang, onLangChange } from '../core/i18n'
import { experiences } from '../data/content'
import { escapeHtml } from '../utils/dom'
import { prefersReducedMotion } from '../utils/device'
import type { Experience } from '../types'

/** Rendu HTML sûr d'un item de timeline pour la langue courante. */
function renderItem(exp: Experience): string {
  const lang = getLang()
  const date = escapeHtml(exp.date[lang])
  const role = escapeHtml(exp.role[lang])
  const company = escapeHtml(exp.company)
  const location = escapeHtml(exp.location)

  const bullets = exp.bullets[lang]
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join('')

  const tags = exp.tags
    .map((tg) => `<span class="tag">${escapeHtml(tg)}</span>`)
    .join('')

  return (
    '<div class="tl-item">' +
    `<div class="tl-item__meta"><span class="tl-item__date">${date}</span>${company} · ${location}</div>` +
    '<div>' +
    `<h3 class="tl-item__role">${role}</h3>` +
    `<div class="tl-item__company">${company}</div>` +
    `<ul class="tl-item__bullets">${bullets}</ul>` +
    `<div class="tl-item__tags">${tags}</div>` +
    '</div>' +
    '</div>'
  )
}

/** (Re)construit le contenu de la timeline dans `root`. */
function build(root: HTMLElement): void {
  const items = experiences.map(renderItem).join('')
  root.innerHTML = `<div class="timeline__fill"></div>${items}`
}

export function initTimeline(root: HTMLElement): void {
  // ScrollTriggers créés par ce module — tués avant chaque reconstruction.
  let triggers: ScrollTrigger[] = []

  const killTriggers = (): void => {
    for (const st of triggers) st.kill()
    triggers = []
  }

  const animate = (): void => {
    const fill = root.querySelector<HTMLElement>('.timeline__fill')
    const tlItems = Array.from(root.querySelectorAll<HTMLElement>('.tl-item'))

    if (prefersReducedMotion()) {
      // Fallback statique : barre pleine, items visibles.
      if (fill) fill.style.height = '100%'
      gsap.set(tlItems, { clearProps: 'all' })
      return
    }

    // Barre de progression liée au scroll de la section.
    if (fill) {
      const fillTween = gsap.fromTo(
        fill,
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top 70%',
            end: 'bottom 80%',
            scrub: true,
          },
        },
      )
      const fillST = fillTween.scrollTrigger
      if (fillST) triggers.push(fillST)
    }

    // Reveal léger de chaque item.
    for (const item of tlItems) {
      const tween = gsap.from(item, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
        },
      })
      const st = tween.scrollTrigger
      if (st) triggers.push(st)
    }
  }

  build(root)
  animate()

  // Reconstruit au changement de langue puis recalcule les positions GSAP.
  onLangChange(() => {
    killTriggers()
    build(root)
    animate()
    ScrollTrigger.refresh()
  })
}
