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
    next()
  })

  api.get('/state/:code', async (req, res) => {
    const pool = getPool()
    const [[deck]] = await pool.query('SELECT * FROM decks WHERE device_id = ?', [req.code])
    // a new browser asks before it has saved anything: an answer, not an error
    if (!deck) return res.json({ saved: false })
    await pool.query('UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?', [req.code])
    const [deckSongs] = await pool.query(
      'SELECT s.* FROM deck_songs d JOIN songs s ON s.video_id = d.video_id WHERE d.device_id = ? ORDER BY d.position',
      [req.code],
    )
    const [lists] = await pool.query('SELECT id, name, saved_at FROM playlists WHERE device_id = ? ORDER BY position', [req.code])
    const [listSongs] = await pool.query(
      'SELECT p.playlist_id, s.* FROM playlist_songs p JOIN songs s ON s.video_id = p.video_id WHERE p.device_id = ? ORDER BY p.playlist_id, p.position',
      [req.code],
    )
    const byList = new Map(lists.map((l) => [l.id, []]))
    for (const r of listSongs) byList.get(r.playlist_id)?.push(toSong(r))
    res.json({
      saved: true,
      updatedAt: Number(deck.client_updated),
      current: deck.current_video,
      volume: deck.volume,
      muted: Boolean(deck.muted),
      linked: deck.linked_playlist,
      songs: deckSongs.map(toSong),
      playlists: lists.map((l) => ({ id: l.id, name: l.name, savedAt: new Date(l.saved_at).getTime(), songs: byList.get(l.id) ?? [] })),
    })
  })

  api.put('/state/:code', async (req, res) => {
    const state = cleanState(req.body)
    if (typeof state === 'string') return res.status(400).json({ error: state })
    const conn = await getPool().getConnection()
    try {
      await conn.beginTransaction()
      await conn.query('INSERT INTO devices (id) VALUES (?) ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP', [req.code])
      const [[held]] = await conn.query('SELECT client_updated FROM decks WHERE device_id = ? FOR UPDATE', [req.code])
      if (held && Number(held.client_updated) > state.updatedAt) {
        await conn.rollback()
        return res.status(409).json({ error: 'The server holds a newer copy.', updatedAt: Number(held.client_updated) })
      }

      // every song either list holds, newest title and colour winning
      const catalogue = new Map()
      for (const s of [...state.songs, ...state.playlists.flatMap((p) => p.songs)]) catalogue.set(s.id, s)
      if (catalogue.size) {
        await conn.query(
          `INSERT INTO songs (video_id, title, artist, accent, problem) VALUES ?
           ON DUPLICATE KEY UPDATE title = VALUES(title), artist = VALUES(artist), accent = COALESCE(VALUES(accent), accent), problem = VALUES(problem)`,
          [[...catalogue.values()].map((s) => [s.id, s.title, s.artist, s.accent, s.problem])],
        )
      }

      await conn.query(
        `INSERT INTO decks (device_id, current_video, volume, muted, linked_playlist, client_updated) VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE current_video = VALUES(current_video), volume = VALUES(volume), muted = VALUES(muted),
           linked_playlist = VALUES(linked_playlist), client_updated = VALUES(client_updated)`,
        [req.code, state.current, state.volume, state.muted, state.linked, state.updatedAt],
      )
      await conn.query('DELETE FROM deck_songs WHERE device_id = ?', [req.code])
      if (state.songs.length) {
        await conn.query('INSERT INTO deck_songs (device_id, position, video_id) VALUES ?', [state.songs.map((s, i) => [req.code, i, s.id])])
      }

      await conn.query('DELETE FROM playlists WHERE device_id = ?', [req.code])
      if (state.playlists.length) {
        await conn.query('INSERT INTO playlists (device_id, id, position, name, saved_at) VALUES ?', [
          state.playlists.map((p, i) => [req.code, p.id, i, p.name, new Date(p.savedAt)]),
        ])
        const rows = state.playlists.flatMap((p) => p.songs.map((s, i) => [req.code, p.id, i, s.id]))
        if (rows.length) await conn.query('INSERT INTO playlist_songs (device_id, playlist_id, position, video_id) VALUES ?', [rows])
      }
      await conn.commit()
      res.json({ ok: true, updatedAt: state.updatedAt, songs: state.songs.length, playlists: state.playlists.length })
    } catch (err) {
      await conn.rollback().catch(() => {})
      throw err
    } finally {
      conn.release()
    }
  })

  api.use((err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large.' })
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'The JSON could not be read.' })
    console.error(err)
    res.status(500).json({ error: 'Server error.' })
  })
  return api
