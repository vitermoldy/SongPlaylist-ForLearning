import express from 'express'

/**
 * The API:
 *   GET /api/health              is the server up, and is MySQL connected
 *   GET /api/state/:code         a device's deck and saved playlists ({ saved: false } before its first save)
 *   PUT /api/state/:code         replace them with the browser's copy (refused with 409 when the
 *                                server already holds a newer one)
 * There are no accounts: a device is its 12-character recovery code. Anyone who knows a code can
 * read and replace its data, so the page shows the code only to its owner.
 */

const CODE = /^[A-HJ-NP-Z2-9]{12}$/
const VIDEO = /^[\w-]{11}$/
const PLAYLIST_ID = /^pl-[a-z0-9-]{1,36}$/
const ACCENT = /^#[0-9A-F]{6}$/i
const MAX_SONGS = 1000
const MAX_PLAYLISTS = 200

/** Writes come as JSON from this site only: no form posts, no other origin. */
function sameOriginWrites(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD') return next()
  if (!req.is('application/json')) return res.status(415).json({ error: 'Send the data as JSON.' })
  const origin = req.headers.origin
  if (origin && req.headers.host && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'Unknown request origin.' })
  next()
}

/** At most `limit` writes per minute per address, enough for a busy tab and not for a script. */
function rateLimit(limit) {
  const hits = new Map()
  return (req, res, next) => {
    if (req.method === 'GET') return next()
    const now = Date.now()
    const key = req.ip ?? 'unknown'
    const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000)
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear()
    if (recent.length > limit) return res.status(429).json({ error: 'Too many requests. Try again in a moment.' })
    next()
  }
}

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

/** A song from the browser, or null when it is not one. */
function cleanSong(s) {
  if (!s || !VIDEO.test(s.id ?? '')) return null
  const title = text(s.title, 200)
  if (!title) return null
  return {
    id: s.id,
    title,
    artist: text(s.artist, 200),
    accent: ACCENT.test(s.accent ?? '') ? s.accent.toUpperCase() : null,
    problem: text(s.problem, 200) || null,
  }
}

/** The browser's copy, checked field by field; a string says what is wrong with it. */
function cleanState(body) {
  if (!body || typeof body !== 'object') return 'The data is empty.'
  const updatedAt = Number(body.updatedAt)
  if (!Number.isFinite(updatedAt) || updatedAt < 0 || updatedAt > Date.now() + 86_400_000) return 'updatedAt is not a time.'
  if (!Array.isArray(body.songs) || body.songs.length > MAX_SONGS) return `songs must be a list of at most ${MAX_SONGS}.`
  if (!Array.isArray(body.playlists) || body.playlists.length > MAX_PLAYLISTS) return `playlists must be a list of at most ${MAX_PLAYLISTS}.`

  const songs = []
  const seen = new Set()
  for (const raw of body.songs) {
    const s = cleanSong(raw)
    if (s && !seen.has(s.id)) {
      seen.add(s.id)
      songs.push(s)
    }
  }
  const playlists = []
  const ids = new Set()
  for (const p of body.playlists) {
    if (!p || !PLAYLIST_ID.test(p.id ?? '') || ids.has(p.id) || !Array.isArray(p.songs) || p.songs.length > MAX_SONGS) continue
    const savedAt = Number(p.savedAt)
    if (!Number.isFinite(savedAt)) continue
    ids.add(p.id)
    const list = []
    const inList = new Set()
    for (const raw of p.songs) {
      const s = cleanSong(raw)
      if (s && !inList.has(s.id)) {
        inList.add(s.id)
        list.push(s)
      }
    }
    playlists.push({ id: p.id, name: text(p.name, 60) || 'Playlist', savedAt, songs: list })
  }
  const current = typeof body.current === 'string' && seen.has(body.current) ? body.current : (songs[0]?.id ?? null)
  const volume = Number.isInteger(body.volume) && body.volume >= 0 && body.volume <= 100 ? body.volume : 80
  const linked = typeof body.linked === 'string' && ids.has(body.linked) ? body.linked : null
  return { updatedAt, current, volume, muted: body.muted === true, linked, songs, playlists }
}

const toSong = (r) => ({
  id: r.video_id,
  title: r.title,
  artist: r.artist,
  ...(r.accent ? { accent: r.accent } : {}),
  ...(r.problem ? { problem: r.problem } : {}),
})

/** The pool appears once MySQL answers; until then the API says so instead of hanging. */
export function createApi(getPool) {
  const api = express.Router()
  api.use(express.json({ limit: '2mb' }))
  api.use(sameOriginWrites)
  api.use(rateLimit(120))

  api.get('/health', (_req, res) => res.json({ ok: true, database: Boolean(getPool()) }))

  api.use((_req, res, next) => (getPool() ? next() : res.status(503).json({ error: 'The database is not connected yet.' })))

  api.param('code', (req, res, next, code) => {
    const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!CODE.test(clean)) return res.status(400).json({ error: 'A recovery code has 12 letters and digits.' })
    req.code = clean
