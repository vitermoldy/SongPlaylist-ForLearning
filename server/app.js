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
