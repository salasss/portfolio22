/** querySelector typé (throw si introuvable — pratique pour les hooks garantis). */
export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T => {
  const el = root.querySelector<T>(sel)
  if (!el) throw new Error(`[dom] élément introuvable : ${sel}`)
  return el
}

/** querySelector qui peut renvoyer null (hooks optionnels). */
export const qsOpt = <T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document,
): T | null => root.querySelector<T>(sel)

export const qsa = <T extends Element = HTMLElement>(
  sel: string,
  root: ParentNode = document,
): T[] => Array.from(root.querySelectorAll<T>(sel))

type Tag = keyof HTMLElementTagNameMap
export const el = <K extends Tag>(
  tag: K,
  attrs: Record<string, string> = {},
  html?: string,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v
    else node.setAttribute(k, v)
  }
  if (html !== undefined) node.innerHTML = html
  return node
}

/** addEventListener avec retour de désabonnement. */
export const on = <K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  fn: (e: WindowEventMap[K]) => void,
  opts?: AddEventListenerOptions,
) => {
  target.addEventListener(type, fn as EventListener, opts)
  return () => target.removeEventListener(type, fn as EventListener, opts)
}

export const onEl = (
  target: EventTarget,
  type: string,
  fn: (e: Event) => void,
  opts?: AddEventListenerOptions,
) => {
  target.addEventListener(type, fn, opts)
  return () => target.removeEventListener(type, fn, opts)
}

/** Échappe le HTML pour insertion sûre. */
export const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )

export const raf = (fn: FrameRequestCallback): number => requestAnimationFrame(fn)
