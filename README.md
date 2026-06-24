# Salas Alkama — Portfolio

Portfolio personnel **dark-tech / awwwards-able** : vanilla **TypeScript** + **GSAP** + **Lenis**,
from scratch et modulaire. Hero « graphe d'infra » animé, compétences en **metaballs gooey**,
bilingue **FR/EN**, double thème **nuit/lumière**, popups projets in-page, command palette, terminal `sudo`.

> ⚠️ Ce projet n'a **pas** été installé/testé sur la machine de création (npm indisponible).
> Lance les commandes ci-dessous sur une machine avec Node ≥ 18 pour le voir tourner.

## 🚀 Démarrage

```bash
npm install      # installe gsap + lenis + vite + typescript
npm run dev      # serveur de dev (http://localhost:5173)
npm run build    # typecheck (tsc) + build de prod -> dist/
npm run preview  # prévisualise le build
```

## 🔧 Configuration (optionnelle)

Copie `.env.example` en `.env` :

```
VITE_CONTACT_ENDPOINT=   # Formspree/Web3Forms — vide = fallback mailto:
VITE_PLAUSIBLE_DOMAIN=   # ex: salas-alkama.dev — vide = pas d'analytics
```

## 📦 À fournir (placeholders en attendant)

- **CV** : dépose `public/cv/Salas-Alkama-CV.pdf` (cf. `public/cv/README.txt`).
- **og-image** : `public/og-image.png` (1200×630) pour les aperçus sociaux.
- **Liens projets** : ajoute `github`/`demo` aux projets dans `src/data/content.ts`
  (sinon la popup affiche « repo privé »).
- **Niveaux de compétences** : ajuste `level` (1-5) dans `src/data/content.ts` (estimés depuis le CV).
- **Endpoint formulaire** : renseigne `VITE_CONTACT_ENDPOINT` (sinon le formulaire ouvre un mail).

## 🗂️ Structure

```
src/
├─ main.ts            # bootstrap & câblage (ordre d'init)
├─ types.ts           # contrat de types partagé
├─ vite-env.d.ts
├─ styles/            # tokens (nuit+lumière), reset, base, components
├─ core/              # services partagés + comportements
│  ├─ gsap.ts ticker.ts theme.ts i18n.ts sound.ts reveal.ts toast.ts
│  ├─ scroll.ts cursor.ts preloader.ts palette.ts terminal.ts easter.ts
├─ components/        # hero graphe, metaballs, timeline, projets, marquee…
└─ data/content.ts    # TOUT le contenu (CV) bilingue FR/EN
```

Tout le contenu éditable (textes, projets, compétences, expériences) est dans
**`src/data/content.ts`**. Les couleurs/typo/espacements dans **`src/styles/tokens.css`**.

## 🎨 Personnalisation rapide

- **Couleurs / dégradé** : `src/styles/tokens.css` (`--grad-a` violet, `--grad-b` ambre).
- **Thème par défaut** : nuit (modifiable dans `src/core/theme.ts`).
- **Fonts** : chargées par CDN (Fontshare + Google Fonts) dans `index.html`.
  Pour de meilleures perfs, self-host les `woff2` dans `public/fonts/` et adapte le `@font-face`.

## ⌨️ Easter eggs

- `Cmd/Ctrl + K` → command palette
- tape `sudo` → terminal interactif (`help`, `ls projects`, `cat cv`, `theme`, …)
- Konami code `↑↑↓↓←→←→ B A` → surprise
- ouvre la console (DevTools) 👀

## ♿ Accessibilité & perfs

- `prefers-reduced-motion` respecté (anims coupées, canvas statiques).
- Contraste AA dans les deux thèmes, focus visibles, navigation clavier.
- Une seule boucle `requestAnimationFrame` partagée ; canvas en pause hors écran.

## ☁️ Déploiement

- **Vercel** : importe le repo, framework « Vite », c'est tout (`vercel.json` fourni).
- **Netlify** : `netlify.toml` fourni (build `npm run build`, publish `dist`).
- Page **404** terminal incluse (`public/404.html`).

---

Conçu & codé from scratch. © Salas Alkama.
