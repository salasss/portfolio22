// ============================================================
// HeroGraph — constellation d'infra du hero (Canvas 2D).
// Nœuds = services cloud reliés par des arêtes ; drift lent via
// smoothNoise, parallax + répulsion souris, arêtes illuminées et
// "paquets" lumineux quand le curseur s'approche.
// Fond derrière le contenu : opacités modérées pour la lisibilité.
// ============================================================
import { onTick } from '../core/ticker'
import { getColors, onThemeChange } from '../core/theme'
import { lerp, clamp, dist, TAU, rand, smoothNoise } from '../utils/math'
import { dpr, prefersReducedMotion } from '../utils/device'
import type { ThemeColors } from '../types'

const LABELS: readonly string[] = [
  'GCP',
  'K8s',
  'Docker',
  'Terraform',
  'Cloud Run',
  'DNS',
  'LB',
  'CI/CD',
  'Vault',
  'Pub/Sub',
  'VPC',
  'IAM',
]

interface Node {
  /** Position de repos (avant drift / répulsion), en px CSS. */
  baseX: number
  baseY: number
  /** Position courante effective (drift + répulsion), en px CSS. */
  x: number
  y: number
  /** Graine de bruit indépendante par axe. */
  seedX: number
  seedY: number
  radius: number
  label: string | null
}

interface Packet {
  /** Indices des nœuds reliés. */
  a: number
  b: number
  /** Progression le long de l'arête [0..1]. */
  pos: number
  speed: number
}

export function initHeroGraph(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const reduced = prefersReducedMotion()

  let colors: ThemeColors = getColors()
  let width = 0 // px CSS
  let height = 0 // px CSS
  let ratio = dpr()

  let nodes: Node[] = []
  const packets: Packet[] = []
  let edgeThreshold = 150

  // Souris (px CSS, relative au canvas). Hors écran tant qu'inconnue.
  let mouseX = -9999
  let mouseY = -9999
  let hasMouse = false
  // Cible de parallax lissée.
  let parX = 0
  let parY = 0
  let parTargetX = 0
  let parTargetY = 0

  let visible = true

  const PARALLAX = 26 // amplitude max du décalage de champ (px CSS)
  const REPULSE_RADIUS = 120 // rayon de répulsion souris (px CSS)
  const REPULSE_FORCE = 26 // poussée max (px CSS)
  const ILLUM_RADIUS = 170 // distance souris→arête pour illuminer

  // ---- Construction du graphe (dépend de la largeur) ----------
  function buildNodes(): void {
    const count = Math.round(clamp(width / 60, 18, 46))
    const next: Node[] = []
    const margin = Math.min(width, height) * 0.06
    for (let i = 0; i < count; i++) {
      const bx = rand(margin, width - margin)
      const by = rand(margin, height - margin)
      const label = i < LABELS.length ? (LABELS[i] ?? null) : null
      next.push({
        baseX: bx,
        baseY: by,
        x: bx,
        y: by,
        seedX: rand(0, 1000),
        seedY: rand(0, 1000),
        radius: label ? rand(2.4, 3.6) : rand(1.4, 2.4),
        label,
      })
    }
    nodes = next
    packets.length = 0
    edgeThreshold = clamp(Math.min(width, height) * 0.22, 110, 220)
  }

  // ---- Dimensionnement (DPR + ResizeObserver) -----------------
  function resize(): void {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    ratio = dpr()
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    buildNodes()
    if (reduced || !visible) drawStatic()
  }

  // ---- Couleur avec alpha (gère hex #rgb/#rrggbb et rgb/rgba) --
  function withAlpha(color: string, alpha: number): string {
    const c = color.trim()
    if (c.startsWith('#')) {
      let r = 0
      let g = 0
      let b = 0
      if (c.length === 4) {
        r = parseInt(c[1] ?? '0', 16) * 17
        g = parseInt(c[2] ?? '0', 16) * 17
        b = parseInt(c[3] ?? '0', 16) * 17
      } else if (c.length >= 7) {
        r = parseInt(c.slice(1, 3), 16)
        g = parseInt(c.slice(3, 5), 16)
        b = parseInt(c.slice(5, 7), 16)
      }
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return `rgba(124, 58, 237, ${alpha})`
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const nums = c.match(/[\d.]+/g)
    if (nums && nums.length >= 3) {
      return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`
    }
    return c
  }

  // ---- Mise à jour des positions (drift + parallax + répulsion)-
  function update(dt: number, t: number): void {
    // Parallax lissée vers la cible (issue de la souris).
    parX = lerp(parX, parTargetX, 1 - Math.pow(0.001, dt))
    parY = lerp(parY, parTargetY, 1 - Math.pow(0.001, dt))

    for (const n of nodes) {
      // Drift lent : bruit lisse recentré sur [-1,1].
      const dx = (smoothNoise(t * 0.12 + n.seedX) - 0.5) * 2
      const dy = (smoothNoise(t * 0.12 + n.seedY) - 0.5) * 2
      let x = n.baseX + dx * 14 + parX
      let y = n.baseY + dy * 14 + parY

      // Répulsion douce du curseur.
      if (hasMouse) {
        const d = dist(x, y, mouseX, mouseY)
        if (d < REPULSE_RADIUS && d > 0.001) {
          const push = (1 - d / REPULSE_RADIUS) * REPULSE_FORCE
          x += ((x - mouseX) / d) * push
          y += ((y - mouseY) / d) * push
        }
      }
      n.x = x
      n.y = y
    }
  }

  // ---- Spawn / avance des paquets sur arêtes illuminées --------
  function spawnPackets(): void {
    if (!hasMouse) return
    // Limite le nombre de paquets simultanés.
    if (packets.length >= 8) return
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      if (!a) continue
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        if (!b) continue
        const d = dist(a.x, a.y, b.x, b.y)
        if (d >= edgeThreshold) continue
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        if (dist(mx, my, mouseX, mouseY) > ILLUM_RADIUS) continue
        if (Math.random() < 0.012 && packets.length < 8) {
          packets.push({ a: i, b: j, pos: 0, speed: rand(0.4, 0.9) })
        }
      }
    }
  }

  function advancePackets(dt: number): void {
    for (let k = packets.length - 1; k >= 0; k--) {
      const p = packets[k]
      if (!p) continue
      p.pos += p.speed * dt
      if (p.pos >= 1) packets.splice(k, 1)
    }
  }

  // ---- Rendu --------------------------------------------------
  function draw(): void {
    ctx.clearRect(0, 0, width, height)

    // Arêtes.
    ctx.lineWidth = 1
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      if (!a) continue
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        if (!b) continue
        const d = dist(a.x, a.y, b.x, b.y)
        if (d >= edgeThreshold) continue

        // Opacité décroissante avec la distance.
        const fade = 1 - d / edgeThreshold

        // Illumination si l'arête est proche de la souris.
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const md = hasMouse ? dist(mx, my, mouseX, mouseY) : Infinity
        const illum = md < ILLUM_RADIUS ? 1 - md / ILLUM_RADIUS : 0

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        if (illum > 0.01) {
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
          grad.addColorStop(0, withAlpha(colors.gradA, 0.18 + illum * 0.5))
          grad.addColorStop(1, withAlpha(colors.gradB, 0.18 + illum * 0.5))
          ctx.strokeStyle = grad
          ctx.lineWidth = 1 + illum * 0.6
        } else {
          ctx.strokeStyle = withAlpha(colors.line, 0.5 * fade + 0.06)
          ctx.lineWidth = 1
        }
        ctx.stroke()
      }
    }

    // Paquets lumineux le long des arêtes.
    if (!reduced) {
      for (const p of packets) {
        const a = nodes[p.a]
        const b = nodes[p.b]
        if (!a || !b) continue
        const px = lerp(a.x, b.x, p.pos)
        const py = lerp(a.y, b.y, p.pos)
        const r = 2.6
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 4)
        glow.addColorStop(0, withAlpha(colors.gradB, 0.85))
        glow.addColorStop(1, withAlpha(colors.gradB, 0))
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(px, py, r * 4, 0, TAU)
        ctx.fill()
        ctx.fillStyle = withAlpha(colors.gradB, 0.95)
        ctx.beginPath()
        ctx.arc(px, py, r, 0, TAU)
        ctx.fill()
      }
    }

    // Nœuds + halos + labels.
    ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const n of nodes) {
      const near =
        hasMouse && dist(n.x, n.y, mouseX, mouseY) < REPULSE_RADIUS * 1.2
      const haloA = near ? 0.22 : 0.1

      // Halo.
      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 6)
      halo.addColorStop(0, withAlpha(near ? colors.gradB : colors.gradA, haloA))
      halo.addColorStop(1, withAlpha(near ? colors.gradB : colors.gradA, 0))
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius * 6, 0, TAU)
      ctx.fill()

      // Point.
      ctx.fillStyle = withAlpha(colors.text, n.label ? 0.7 : 0.45)
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, TAU)
      ctx.fill()

      // Label (seulement nœuds nommés).
      if (n.label) {
        ctx.fillStyle = withAlpha(colors.dim, near ? 0.85 : 0.42)
        ctx.fillText(n.label, n.x, n.y - n.radius - 8)
      }
    }
  }

  /** Rendu statique unique (reduced motion ou hors écran). */
  function drawStatic(): void {
    parX = 0
    parY = 0
    parTargetX = 0
    parTargetY = 0
    hasMouse = false
    for (const n of nodes) {
      const dx = (smoothNoise(n.seedX) - 0.5) * 2
      const dy = (smoothNoise(n.seedY) - 0.5) * 2
      n.x = n.baseX + dx * 14
      n.y = n.baseY + dy * 14
    }
    draw()
  }

  // ---- Boucle d'animation -------------------------------------
  let stopTick: (() => void) | null = null
  function startLoop(): void {
    if (stopTick) return
    stopTick = onTick((dt, t) => {
      if (!visible || reduced) return
      update(dt, t)
      spawnPackets()
      advancePackets(dt)
      draw()
    })
  }
  function stopLoop(): void {
    if (stopTick) {
      stopTick()
      stopTick = null
    }
  }

  // ---- Souris (window → coords canvas) ------------------------
  function onPointerMove(e: PointerEvent): void {
    const rect = canvas.getBoundingClientRect()
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    mouseX = e.clientX - rect.left
    mouseY = e.clientY - rect.top
    hasMouse = inside
    // Parallax : centre = 0, bords = ±PARALLAX (inverse pour effet profondeur).
    const nx = clamp((mouseX / width) * 2 - 1, -1, 1)
    const ny = clamp((mouseY / height) * 2 - 1, -1, 1)
    parTargetX = -nx * PARALLAX
    parTargetY = -ny * PARALLAX
  }
  function onPointerLeave(): void {
    hasMouse = false
    parTargetX = 0
    parTargetY = 0
  }

  // ---- Observers ----------------------------------------------
  const ro = new ResizeObserver(() => resize())
  ro.observe(canvas)

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      visible = entry.isIntersecting
      if (reduced) {
        if (visible) drawStatic()
        return
      }
      if (visible) startLoop()
      else stopLoop()
    },
    { threshold: 0 },
  )
  io.observe(canvas)

  // Re-lecture des couleurs au changement de thème.
  onThemeChange(() => {
    colors = getColors()
    if (reduced || !visible) drawStatic()
  })

  // Init.
  resize()
  if (reduced) {
    drawStatic()
  } else {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave, { passive: true })
    startLoop()
  }
}
