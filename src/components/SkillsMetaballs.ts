// ============================================================
// SkillsMetaballs.ts — nuage de compétences "gooey" (Canvas 2D).
//
// Chaque skill = une bulle dont le rayon dépend de son niveau et la
// couleur de son pôle. Les bulles sont attirées (ressort) vers l'ancre
// de leur pôle, se repoussent doucement entre elles et s'écartent du
// curseur. Le rendu fusionne les bulles via un champ scalaire metaball
// calculé en basse résolution (canvas offscreen) puis seuillé et
// upscalé pour obtenir des contours qui se rejoignent (effet gooey).
//
// Légende (#skills-legend), tooltips (.skills__tooltip) et noms courts
// au centre des grosses bulles complètent le tout. Re-render i18n,
// re-lecture des couleurs au changement de thème, DPR, ResizeObserver,
// IntersectionObserver (pause hors écran) et fallback statique en
// prefers-reduced-motion.
// ============================================================
import type { ThemeColors } from '../types'
import { skills, poles } from '../data/content'
import { onTick } from '../core/ticker'
import { getColors, onThemeChange } from '../core/theme'
import { getLang, onLangChange } from '../core/i18n'
import { qsOpt, el, onEl } from '../utils/dom'
import { clamp, dist, lerp, rand, TAU } from '../utils/math'
import { dpr, prefersReducedMotion, isCoarsePointer } from '../utils/device'

/* ---------- Réglages ---------- */
const SCALE = 4 // facteur de sous-échantillonnage du champ metaball
const BASE_RADIUS = 16 // rayon de base (niveau 0)
const LEVEL_RADIUS = 7 // rayon ajouté par niveau
const THRESHOLD = 1 // seuil du champ scalaire (>=1 -> dans une bulle)
const SPRING = 2.6 // raideur du ressort vers l'ancre du pôle
const DAMPING = 3.4 // amortissement (frottement) des vitesses
const REPULSE = 240 // intensité de répulsion entre bulles
const CURSOR_RADIUS = 140 // rayon d'influence du curseur (px CSS) — doux, pour ne pas faire "fuir" le survol
const CURSOR_FORCE = 750 // intensité de poussée du curseur (faible : on veut pouvoir survoler)
const MAX_SPEED = 520 // vitesse max (px/s) — anti-explosion

interface Bubble {
  readonly skillIndex: number
  readonly pole: number // index dans `poles`
  readonly r: number // rayon (px CSS)
  ax: number // ancre X (px CSS)
  ay: number // ancre Y (px CSS)
  x: number
  y: number
  vx: number
  vy: number
}

interface RGB {
  r: number
  g: number
  b: number
}

/** Convertit un hex (#rgb / #rrggbb) en composantes RGB. */
function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) {
    const r = h[0] ?? '0'
    const g = h[1] ?? '0'
    const b = h[2] ?? '0'
    h = `${r}${r}${g}${g}${b}${b}`
  }
  const int = parseInt(h.slice(0, 6) || '000000', 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

/** Parse une couleur CSS quelconque (hex / rgb / rgba) en RGB. */
function parseColor(input: string): RGB {
  const s = input.trim()
  if (s.startsWith('#')) return hexToRgb(s)
  const m = s.match(/-?\d+(\.\d+)?/g)
  if (m && m.length >= 3) {
    return {
      r: clamp(Number(m[0]), 0, 255),
      g: clamp(Number(m[1]), 0, 255),
      b: clamp(Number(m[2]), 0, 255),
    }
  }
  return { r: 255, g: 255, b: 255 }
}

/** Niveau (1..5) -> points pleins/vides : '●●●●○'. */
function levelDots(level: number): string {
  const full = clamp(Math.round(level), 0, 5)
  return '●'.repeat(full) + '○'.repeat(5 - full)
}

export function initSkillsMetaballs(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // Alias non-null : préserve le type dans les closures imbriquées.
  const g: CanvasRenderingContext2D = ctx

  const reduced = prefersReducedMotion()
  const legendHost = qsOpt('#skills-legend')

  // Couleurs du thème (re-lues à chaque changement).
  let colors: ThemeColors = getColors()
  let gradA: RGB = parseColor(colors.gradA)
  let gradB: RGB = parseColor(colors.gradB)
  let bg: RGB = parseColor(colors.bg)
  // Couleurs RGB pré-calculées par pôle.
  const poleRgb: RGB[] = poles.map((p) => parseColor(p.color))

  function refreshColors(): void {
    colors = getColors()
    gradA = parseColor(colors.gradA)
    gradB = parseColor(colors.gradB)
    bg = parseColor(colors.bg)
  }

  /* ---------- Dimensions / DPR / offscreen ---------- */
  let cssW = 1
  let cssH = 1
  let ratio = dpr()
  let scaleResp = 1 // échelle responsive des rayons

  // Canvas offscreen pour le champ metaball (basse résolution).
  const field = document.createElement('canvas')
  const fctx = field.getContext('2d')
  // Buffer ImageData réutilisé pour le seuillage du champ.
  let fieldW = 1
  let fieldH = 1
  let image: ImageData | null = null

  function resize(): void {
    const rect = canvas.getBoundingClientRect()
    cssW = Math.max(1, Math.round(rect.width))
    cssH = Math.max(1, Math.round(rect.height))
    ratio = dpr()
    canvas.width = Math.max(1, Math.round(cssW * ratio))
    canvas.height = Math.max(1, Math.round(cssH * ratio))

    fieldW = Math.max(1, Math.ceil(cssW / SCALE))
    fieldH = Math.max(1, Math.ceil(cssH / SCALE))
    field.width = fieldW
    field.height = fieldH
    if (fctx) image = fctx.createImageData(fieldW, fieldH)

    // Échelle responsive : réduit les rayons sur petites scènes.
    scaleResp = clamp(Math.min(cssW, cssH) / 520, 0.55, 1.05)

    layoutAnchors()
  }

  /* ---------- Bulles ---------- */
  const radiusOf = (level: number): number =>
    (BASE_RADIUS + level * LEVEL_RADIUS) * scaleResp

  const bubbles: Bubble[] = skills.map((skill, i) => {
    const poleIdx = poles.findIndex((p) => p.key === skill.pole)
    return {
      skillIndex: i,
      pole: poleIdx < 0 ? 0 : poleIdx,
      r: radiusOf(skill.level),
      ax: 0,
      ay: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }
  })

  /** Place les ancres des pôles en cercle, et répartit les bulles autour. */
  function layoutAnchors(): void {
    const cx = cssW / 2
    const cy = cssH / 2
    const poleCount = poles.length
    // Rayon du cercle des pôles (laisse une marge sur les bords).
    const ring = Math.min(cssW, cssH) * 0.3
    const anchors = poles.map((_, p) => {
      if (poleCount === 1) return { x: cx, y: cy }
      const a = -Math.PI / 2 + (p / poleCount) * TAU
      return { x: cx + Math.cos(a) * ring, y: cy + Math.sin(a) * ring }
    })

    // Compte les bulles par pôle pour répartir en sous-cercle.
    const seen = new Map<number, number>()
    const totals = new Map<number, number>()
    for (const b of bubbles) totals.set(b.pole, (totals.get(b.pole) ?? 0) + 1)

    for (const b of bubbles) {
      const anchor = anchors[b.pole] ?? { x: cx, y: cy }
      const idx = seen.get(b.pole) ?? 0
      seen.set(b.pole, idx + 1)
      const total = totals.get(b.pole) ?? 1
      const sub = total > 1 ? (idx / total) * TAU : 0
      const spread = (b.r + 18) * (total > 3 ? 1.5 : 1.1)
      // Ancre individuelle légèrement éclatée autour de l'ancre du pôle.
      b.ax = clamp(anchor.x + Math.cos(sub) * spread, b.r, cssW - b.r)
      b.ay = clamp(anchor.y + Math.sin(sub) * spread, b.r, cssH - b.r)
    }
  }

  /** Position initiale : sur l'ancre + jitter (anim) ou en grille (statique). */
  function placeBubbles(): void {
    if (reduced) {
      // Grille statique compacte, sans animation.
      const cols = Math.max(1, Math.ceil(Math.sqrt(bubbles.length)))
      const cellW = cssW / cols
      const rows = Math.ceil(bubbles.length / cols)
      const cellH = cssH / Math.max(1, rows)
      bubbles.forEach((b, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        b.x = (col + 0.5) * cellW
        b.y = (row + 0.5) * cellH
        b.vx = 0
        b.vy = 0
      })
      return
    }
    for (const b of bubbles) {
      b.x = clamp(b.ax + rand(-30, 30), b.r, cssW - b.r)
      b.y = clamp(b.ay + rand(-30, 30), b.r, cssH - b.r)
      b.vx = 0
      b.vy = 0
    }
  }

  /* ---------- Pointeur ---------- */
  let pointerX = -9999
  let pointerY = -9999 // coords CSS relatives au canvas
  let pointerActive = false
  let hovered = -1 // index de bulle survolée (pour tooltip)

  /* ---------- Tooltip ---------- */
  let tooltip: HTMLDivElement | null = null
  const ensureTooltip = (): HTMLDivElement => {
    if (!tooltip) {
      tooltip = el('div', { class: 'skills__tooltip', role: 'tooltip' })
      document.body.appendChild(tooltip)
    }
    return tooltip
  }

  function showTooltip(b: Bubble, clientX: number, clientY: number): void {
    const skill = skills[b.skillIndex]
    if (!skill) return
    const tip = ensureTooltip()
    const note = skill.note[getLang()]
    tip.innerHTML = `${skill.name}<small>${note} · ${levelDots(skill.level)}</small>`
    tip.style.left = `${clientX}px`
    tip.style.top = `${clientY - 14}px`
    tip.classList.add('is-visible')
  }

  function hideTooltip(): void {
    if (tooltip) tooltip.classList.remove('is-visible')
    hovered = -1
  }

  /* ---------- Légende ---------- */
  function renderLegend(): void {
    if (!legendHost) return
    legendHost.replaceChildren()
    const lang = getLang()
    for (const p of poles) {
      const li = el('li')
      const dot = el('span', { class: 'dot' })
      dot.style.background = p.color
      li.appendChild(dot)
      li.appendChild(document.createTextNode(p.label[lang]))
      legendHost.appendChild(li)
    }
  }

  /* ---------- Physique ---------- */
  function simulate(dt: number): void {
    const step = clamp(dt, 0, 0.04) // borne anti-saut
    for (const b of bubbles) {
      // Ressort vers l'ancre.
      b.vx += (b.ax - b.x) * SPRING * step
      b.vy += (b.ay - b.y) * SPRING * step
    }

    // Répulsion douce entre paires de bulles (chevauchement).
    for (let i = 0; i < bubbles.length; i++) {
      const a = bubbles[i]
      if (!a) continue
      for (let j = i + 1; j < bubbles.length; j++) {
        const c = bubbles[j]
        if (!c) continue
        const dx = c.x - a.x
        const dy = c.y - a.y
        const d = Math.hypot(dx, dy) || 0.0001
        const min = (a.r + c.r) * 0.9
        if (d < min) {
          const overlap = (min - d) / min
          const nx = dx / d
          const ny = dy / d
          const f = overlap * REPULSE * step
          a.vx -= nx * f
          a.vy -= ny * f
          c.vx += nx * f
          c.vy += ny * f
        }
      }
    }

    // Poussée du curseur (écarte délicatement) — SAUF la bulle survolée,
    // qu'on laisse en place pour pouvoir lire son tooltip.
    if (pointerActive) {
      for (let i = 0; i < bubbles.length; i++) {
        if (i === hovered) continue
        const b = bubbles[i]
        if (!b) continue
        const dx = b.x - pointerX
        const dy = b.y - pointerY
        const d = Math.hypot(dx, dy) || 0.0001
        const reach = CURSOR_RADIUS + b.r
        if (d < reach) {
          const t = 1 - d / reach
          const f = t * t * CURSOR_FORCE * step
          b.vx += (dx / d) * f
          b.vy += (dy / d) * f
        }
      }
      // La bulle survolée est "épinglée" : on freine fortement sa vitesse
      // pour qu'elle reste sous le curseur (lecture du tooltip facile).
      const hb = hovered >= 0 ? bubbles[hovered] : undefined
      if (hb) {
        hb.vx *= 0.4
        hb.vy *= 0.4
      }
    }

    // Intégration + amortissement + bornes de scène.
    const damp = Math.exp(-DAMPING * step)
    for (const b of bubbles) {
      b.vx *= damp
      b.vy *= damp
      // Clamp de vitesse.
      const sp = Math.hypot(b.vx, b.vy)
      if (sp > MAX_SPEED) {
        b.vx = (b.vx / sp) * MAX_SPEED
        b.vy = (b.vy / sp) * MAX_SPEED
      }
      b.x += b.vx * step
      b.y += b.vy * step
      // Rebond doux sur les bords.
      if (b.x < b.r) {
        b.x = b.r
        b.vx *= -0.3
      } else if (b.x > cssW - b.r) {
        b.x = cssW - b.r
        b.vx *= -0.3
      }
      if (b.y < b.r) {
        b.y = b.r
        b.vy *= -0.3
      } else if (b.y > cssH - b.r) {
        b.y = cssH - b.r
        b.vy *= -0.3
      }
    }
  }

  /* ---------- Rendu metaball gooey ---------- */
  function renderField(): void {
    if (!fctx || !image) return
    const data = image.data
    const w = fieldW
    const h = fieldH
    const inv = 1 / SCALE

    // Pré-calcul des bulles en coordonnées du champ.
    const fb = bubbles.map((b) => ({
      x: b.x * inv,
      y: b.y * inv,
      r2: (b.r * inv) * (b.r * inv),
      pole: b.pole,
    }))

    let p = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0
        // Accumulation pondérée des couleurs des pôles dominants.
        let cr = 0
        let cg = 0
        let cb = 0
        let wsum = 0
        for (let k = 0; k < fb.length; k++) {
          const m = fb[k]
          if (!m) continue
          const dx = x - m.x
          const dy = y - m.y
          const d2 = dx * dx + dy * dy + 0.0001
          const contrib = m.r2 / d2
          sum += contrib
          const col = poleRgb[m.pole] ?? gradA
          cr += col.r * contrib
          cg += col.g * contrib
          cb += col.b * contrib
          wsum += contrib
        }

        if (sum >= THRESHOLD) {
          // Couleur de base = couleur dominante du pôle au pixel.
          let r = wsum > 0 ? cr / wsum : gradA.r
          let g = wsum > 0 ? cg / wsum : gradA.g
          let bl = wsum > 0 ? cb / wsum : gradA.b
          // Zone de contact (champ élevé) : teinte vers le dégradé.
          // sum grand = recouvrement -> fusion mise en valeur.
          const blendT = clamp((sum - THRESHOLD) / 2.2, 0, 1) * 0.55
          const gt = clamp((x + y) / (w + h), 0, 1)
          const gradR = gradA.r + (gradB.r - gradA.r) * gt
          const gradG = gradA.g + (gradB.g - gradA.g) * gt
          const gradB2 = gradA.b + (gradB.b - gradA.b) * gt
          r = lerp(r, gradR, blendT)
          g = lerp(g, gradG, blendT)
          bl = lerp(bl, gradB2, blendT)

          // Anti-alias sur la frontière : alpha selon proximité du seuil.
          const edge = clamp((sum - THRESHOLD) * 2.5, 0, 1)
          const alpha = lerp(170, 255, edge)
          data[p] = r
          data[p + 1] = g
          data[p + 2] = bl
          data[p + 3] = alpha
        } else {
          data[p + 3] = 0
        }
        p += 4
      }
    }
    fctx.putImageData(image, 0, 0)
  }

  /** Dessine les noms courts au centre des grosses bulles. */
  function renderLabels(): void {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const b of bubbles) {
      // N'affiche que si la bulle est assez grande pour lire le texte.
      if (b.r < 24) continue
      const skill = skills[b.skillIndex]
      if (!skill) continue
      const fontSize = clamp(b.r * 0.34, 8, 13)
      ctx.font = `500 ${fontSize}px 'JetBrains Mono', ui-monospace, monospace`
      // Nom court : tronque les libellés trop longs pour la bulle.
      const maxChars = Math.max(3, Math.floor(b.r / (fontSize * 0.34)))
      let label = skill.name
      if (label.length > maxChars) label = `${label.slice(0, maxChars - 1)}…`
      ctx.fillStyle = bg.r * 0.299 + bg.g * 0.587 + bg.b * 0.114 < 140 ? '#fff' : '#0a0a0f'
      ctx.fillText(label, b.x, b.y)
    }
    ctx.restore()
  }

  function draw(): void {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    renderField()
    // Upscale lissé du champ sur le canvas visible.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(field, 0, 0, fieldW, fieldH, 0, 0, cssW, cssH)

    renderLabels()

    // Anneau de survol (feedback visuel sur la bulle pointée).
    if (hovered >= 0) {
      const hb = bubbles[hovered]
      if (hb) {
        g.save()
        g.beginPath()
        g.arc(hb.x, hb.y, hb.r + 5, 0, TAU)
        g.lineWidth = 1.5
        g.strokeStyle = colors.gradB
        g.globalAlpha = 0.9
        g.stroke()
        g.restore()
      }
    }
  }

  /* ---------- Survol (tooltip) ---------- */
  function updateHover(clientX: number, clientY: number): void {
    // Trouve la bulle sous le curseur (de la plus proche).
    let best = -1
    let bestD = Infinity
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i]
      if (!b) continue
      const d = dist(pointerX, pointerY, b.x, b.y)
      if (d < b.r + 10 && d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best >= 0) {
      const b = bubbles[best]
      if (b) {
        hovered = best
        showTooltip(b, clientX, clientY)
        return
      }
    }
    if (hovered !== -1) hideTooltip()
  }

  /* ---------- Pause hors écran (IntersectionObserver) ---------- */
  let visible = true
  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0]
      if (e) visible = e.isIntersecting
    },
    { threshold: 0.01 },
  )
  io.observe(canvas)

  /* ---------- Câblage ---------- */
  const ro = new ResizeObserver(() => resize())
  ro.observe(canvas)

  // Pointeur : on écoute sur le canvas (coords CSS relatives).
  if (!isCoarsePointer()) {
    onEl(canvas, 'pointermove', (ev) => {
      const e = ev as PointerEvent
      const rect = canvas.getBoundingClientRect()
      pointerX = e.clientX - rect.left
      pointerY = e.clientY - rect.top
      pointerActive = true
      updateHover(e.clientX, e.clientY)
    })
    onEl(canvas, 'pointerleave', () => {
      pointerActive = false
      pointerX = -9999
      pointerY = -9999
      hideTooltip()
    })
  }

  onThemeChange(() => {
    refreshColors()
    if (reduced) draw() // re-dessine la version statique avec les nouvelles couleurs
  })
  onLangChange(() => {
    renderLegend()
    // Met à jour le tooltip ouvert si une bulle est survolée.
    const b = hovered >= 0 ? bubbles[hovered] : undefined
    if (b && tooltip && tooltip.classList.contains('is-visible')) {
      const skill = skills[b.skillIndex]
      if (skill) {
        const note = skill.note[getLang()]
        tooltip.innerHTML = `${skill.name}<small>${note} · ${levelDots(skill.level)}</small>`
      }
    }
  })

  /* ---------- Boot ---------- */
  resize()
  placeBubbles()
  renderLegend()

  if (reduced) {
    // Rendu statique unique (pas d'animation). Tooltips restent OK.
    draw()
    return
  }

  onTick((dt) => {
    if (!visible || cssW <= 1) return
    simulate(dt)
    draw()
  })
}
