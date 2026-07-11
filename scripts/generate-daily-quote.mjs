/**
 * Generate today's motivational quote for Herbie's dashboard.
 *
 * - Calls Anthropic Claude with context about Herbie's projects + focus
 * - Writes result to quote.json in this repo
 * - Commits + pushes to GitHub (GitHub Pages auto-deploys)
 *
 * Run daily via OpenClaw cron. Idempotent \u2014 safe to re-run same day.
 *
 * Env required:
 *   ANTHROPIC_API_KEY  (Claude API key)
 *   GIT_AUTHOR_NAME    (defaults to hlake1)
 *   GIT_AUTHOR_EMAIL   (defaults to herbie@lake.local)
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const QUOTE_PATH = path.join(REPO_ROOT, 'quote.json')

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY')
  process.exit(1)
}

const GIT_NAME = process.env.GIT_AUTHOR_NAME || 'hlake1'
const GIT_EMAIL = process.env.GIT_AUTHOR_EMAIL || 'herbie@lake.local'

const today = new Date().toISOString().slice(0, 10)
const weekday = new Date().toLocaleDateString('en-GB', { weekday: 'long' })

// The prompt is intentionally rich so Claude can pick angles that resonate
// with Herbie's *actual* life \u2014 not a generic motivational quote.
const SYSTEM = `You are Oliver (\ud83e\udd8a), Herbie's AI assistant. Every morning you leave a short, punchy quote or reflection on his dashboard.

Rules:
- 1-3 sentences. Punchy. No filler.
- Sound like a smart friend, not a fortune cookie. No "let your light shine" cliches.
- Vary the angle daily: sometimes a classic quote (attributed), sometimes your own line, sometimes a nudge specific to his current focus.
- If you write your own line, sign it "Oliver \u2014 for Herbie". If you quote someone, use their real name.
- Never mention the day of the week unless it genuinely matters.

Return ONLY strict JSON:
{ "text": "...", "author": "..." }`

const USER = `Herbie's context (fresh every day):
- 20 years old, restaurant manager in Oxfordshire, entrepreneurial
- Building: RTS Guest Research Platform (with Benedict Fowler / Ben, host of Road to Success podcast, Tweak Marketing)
- Exploring: AI Rota Builder for hospitality (his own idea, James at The Masons gave feedback)
- Exploring: Golf companion app (co-founder Gabriel)
- Mentors + network: Oliver Richards, Sam Belcher, Rodney Bennett, Paul, Dan Bennett, Darren Rockett
- Insight he had this week: Ben + Tweak Marketing is his unfair advantage \u2014 built-in distribution most founders would kill for

Today is ${weekday} ${today}.

Give him today's quote. Rotate angles day to day \u2014 sometimes a famous quote, sometimes your own line to him.`

async function callClaude() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content: USER }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`)
  }
  const data = await res.json()
  const text =
    (data.content || [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n') || ''

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Claude returned no JSON: ' + text.slice(0, 200))
  const parsed = JSON.parse(match[0])
  if (typeof parsed.text !== 'string' || typeof parsed.author !== 'string') {
    throw new Error('Claude JSON missing text/author')
  }
  return { text: parsed.text.trim(), author: parsed.author.trim() }
}

function sh(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
    .toString()
    .trim()
}

async function main() {
  console.log(`[quote] Generating quote for ${today}...`)
  const quote = await callClaude()
  console.log(`[quote] "${quote.text}" \u2014 ${quote.author}`)

  const payload = {
    text: quote.text,
    author: quote.author,
    date: today,
    generated_by: 'daily-cron (claude-sonnet-4-6)',
  }
  fs.writeFileSync(QUOTE_PATH, JSON.stringify(payload, null, 2) + '\n')

  // Commit + push if anything changed. If the quote happens to be identical
  // (extremely rare) we exit clean.
  try {
    sh(`git config user.name "${GIT_NAME}"`)
    sh(`git config user.email "${GIT_EMAIL}"`)
    const status = sh('git status --porcelain quote.json')
    if (!status) {
      console.log('[quote] No changes to commit (quote identical to previous).')
      return
    }
    sh('git add quote.json')
    sh(`git commit -m "Daily quote: ${today}"`)
    sh('git push origin main')
    console.log('[quote] Pushed to GitHub. Pages will rebuild in ~30s.')
  } catch (err) {
    console.error('[quote] Git push failed:', err.message)
    // Don't throw \u2014 the JSON is still on disk; a later run will push both.
  }
}

main().catch((err) => {
  console.error('[quote] Failed:', err.message)
  process.exit(1)
})
