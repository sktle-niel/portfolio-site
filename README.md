# Niel Patrick Penlas — Portfolio

A single-page portfolio in plain HTML, CSS, and JavaScript. No build step, no framework, no dependencies to install. Design language: **bryl-minimal** (monochrome, typography-first, light/dark).

## Files

| File | Purpose |
|---|---|
| `index.html` | The page and all content |
| `styles.css` | All styling and theming |
| `main.js` | Theme, menu, scroll reveal, clean routing, contact form |
| `favicon.svg` | Tab icon |
| `assets/` | Project screenshots and portrait (WebP) |
| `404.html`, `_redirects`, `vercel.json`, `.nojekyll` | Clean-URL deploy config |

## Run locally

Open a terminal in this folder and start any static server, then visit the URL it prints:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` by double-click also works, but clean paths like `/projects` only resolve on a server.)

## Deploy

Clean URLs (`/projects`, no `.html`, no `#`) work best when the site is hosted at a **domain root**. Pick one:

- **GitHub Pages (recommended for root):** create a repo named `sktle-niel.github.io`, push these files, enable Pages. Served at `https://sktle-niel.github.io`. `404.html` handles direct deep links; `.nojekyll` keeps files served as-is.
- **Netlify:** drag this folder into Netlify. `_redirects` makes every path serve the page.
- **Vercel:** import the folder. `vercel.json` enables clean URLs and rewrites.

> Note: a GitHub **project** page (`sktle-niel.github.io/repo/`) serves under a sub-path, so prefer the `sktle-niel.github.io` user repo or a custom domain for the cleanest URLs.

## Editing

- **Text / projects:** edit `index.html`.
- **Contact links:** email and phone are assembled in `main.js` (anti-scraping) from the `data-u` / `data-d` / `data-p` attributes in `index.html`.
- **LinkedIn:** currently points to `https://www.linkedin.com/feed/`. Replace with your public profile URL (`https://www.linkedin.com/in/your-handle`) in the three `linkedin.com` links in `index.html` so visitors reach *your* profile instead of their own feed.

## Anti-spam / security (frontend)

- **Content-Security-Policy** meta: scripts limited to this site + one hashed inline bootstrap; no third-party scripts; `object-src`/`base-uri`/`frame-ancestors` locked down. If you edit the inline theme script in `index.html`, recompute its `sha256-` hash in the CSP.
- **Contact form:** honeypot field, a timing trap (rejects sub-3-second submits), a local rate limit (3 per hour), strict validation, and CR/LF stripping to block mail-header injection. It composes a `mailto:` in your own mail app — there is **no server to spam**.
- **Email & phone** are assembled by JavaScript on click, so scrapers reading the static HTML don't get them.
- External links use `rel="noopener noreferrer"`; all user text is written with `textContent` (never `innerHTML`).
