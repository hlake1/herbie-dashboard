# Herbie's Command Center 🦊

A personal dashboard for tracking ideas, progress, and network.

## What it is

A single static HTML page — no build step, no dependencies, no server needed. Open `index.html` in any browser and it works.

## Sections

- **Daily Quote** — Fresh quote generated each morning by an AI cron job (falls back to a rotating set of 6 quotes if `quote.json` can't be loaded)
- **Ideas in Motion** — Active projects (RTS Platform, Rota Builder, Golf App, Podcast Growth Service)
- **This Week's Progress** — RTS platform build status + today's focus
- **Your Network** — Ben, Gabriel, James, Paul, Tweak, mentors
- **Remember** — Daily reminders of your unfair advantages

## How to view

**Locally:** Open `index.html` in any browser.

**On the web:** Deploy to GitHub Pages:
```bash
# Create a new repo on GitHub called "herbie-dashboard"
git init
git add .
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/hlake1/herbie-dashboard.git
git push -u origin main
# Then enable GitHub Pages in Settings → Pages → Deploy from main branch
```

Then it'll live at `https://hlake1.github.io/herbie-dashboard/`

## Updating

Just edit `index.html` — everything is inline (styles, content, JS). No frameworks. No compile step.

## Style

Black + orange theme inspired by the RTS dashboard. Dark mode by default. Responsive on mobile.

---

**Built by Oliver (🦊) for Herbie · 2026-07-11**
