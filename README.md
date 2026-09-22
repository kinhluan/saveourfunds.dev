# saveourfunds.dev

Landing page for the **Source of Funds** team at MoMo — and its second reading, **Save Our Funds**.

A single static page. No build step, no dependencies.

## Run it locally

```bash
python3 -m http.server 4173
# open http://127.0.0.1:4173
```

## Files

| Path | Purpose |
|------|---------|
| `index.html` | The whole page — markup, styles, and the SOF flip script, inline. |
| `CNAME` | Custom domain for GitHub Pages. Deleting it drops the domain. |
| `.nojekyll` | Tells Pages to serve the files as-is instead of running Jekyll. |

## Editing the page

- **Tagline and copy** — plain text in `index.html`, inside `.tagline` and the `.sources` list.
- **Colors** — the `:root` block at the top: `--lime` and `--momo` are the two accents, `--void` the background.
- **The flip** — the `READINGS` array in the script at the bottom holds the two readings. Each entry lists the tails that hang off `S` and `O`; `FUNDS` never changes, so it is hardcoded.

## Deployment

Pushing to `main` publishes the site. GitHub Pages serves the repository root.
