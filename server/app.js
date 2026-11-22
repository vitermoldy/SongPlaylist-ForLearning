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
