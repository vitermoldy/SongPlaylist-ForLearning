import { randomInt } from 'node:crypto'
import { hashPassword, PASSWORD_MAX, PASSWORD_MIN, USERNAME } from './auth.js'
import { config } from './config.js'
import { connect } from './db.js'

/**
 * `npm run set-user -- <username> <kata sandi>`: makes an account, or gives an existing
 * one a new password (there is no reset by email, so this is the reset). A new account
 * takes over the lists saved before accounts existed: the newest browser's deck, plus the
 * saved playlists of every other browser nobody owns yet, so none of them is left behind.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const [username = '', password = ''] = process.argv.slice(2)
if (!USERNAME.test(username) || password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
  console.error(`Pakai: npm run set-user -- <username> <kata sandi>\nUsername 3 sampai 24 karakter (huruf, angka, titik, garis bawah, minus), kata sandi ${PASSWORD_MIN} sampai ${PASSWORD_MAX} karakter.`)
  process.exit(1)
}

const pool = await connect(config.db)
const hash = await hashPassword(password)
const [[found]] = await pool.query('SELECT id, username FROM users WHERE username = ?', [username])
if (found) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, found.id])
  // A new password signs the account out everywhere.
  await pool.query('DELETE FROM sessions WHERE user_id = ?', [found.id])
  console.log(`${config.name}: kata sandi ${found.username} diganti. Semua sesinya dikeluarkan.`)
  await pool.end()
  process.exit(0)
}

const conn = await pool.getConnection()
try {
  await conn.beginTransaction()
  const [free] = await conn.query(
    `SELECT d.id FROM devices d LEFT JOIN users u ON u.device_id = d.id LEFT JOIN decks k ON k.device_id = d.id
     WHERE u.id IS NULL ORDER BY COALESCE(k.client_updated, 0) DESC, d.last_seen DESC`,
  )
  const device = free[0]?.id ?? Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  let moved = 0
  for (const { id: other } of free.slice(1)) {
    // Playlist ids are unique per browser; one that already exists under the account keeps the account's copy.
    const [lists] = await conn.query('SELECT id, name, saved_at FROM playlists WHERE device_id = ? ORDER BY position', [other])
    for (const list of lists) {
      const [[taken]] = await conn.query('SELECT 1 AS x FROM playlists WHERE device_id = ? AND id = ?', [device, list.id])
      if (taken) continue
      const [[{ next }]] = await conn.query('SELECT COALESCE(MAX(position) + 1, 0) AS next FROM playlists WHERE device_id = ?', [device])
      await conn.query('INSERT INTO playlists (device_id, id, position, name, saved_at) VALUES (?, ?, ?, ?, ?)', [device, list.id, next, list.name, list.saved_at])
      await conn.query(
        'INSERT INTO playlist_songs (device_id, playlist_id, position, video_id) SELECT ?, playlist_id, position, video_id FROM playlist_songs WHERE device_id = ? AND playlist_id = ?',
        [device, other, list.id],
      )
      moved++
    }
  }
  if (moved) {
    // The browser shows the newest copy, so the merged playlists count as a change made now.
    await conn.query('INSERT INTO decks (device_id, client_updated) VALUES (?, ?) ON DUPLICATE KEY UPDATE client_updated = VALUES(client_updated)', [device, Date.now()])
  }
  await conn.query('INSERT INTO users (username, password_hash, device_id, created_at) VALUES (?, ?, ?, UTC_TIMESTAMP())', [username, hash, device])
  await conn.commit()
  const [[deck]] = await pool.query('SELECT COUNT(*) AS n FROM deck_songs WHERE device_id = ?', [device])
  const [[lists]] = await pool.query('SELECT COUNT(*) AS n FROM playlists WHERE device_id = ?', [device])
  console.log(
    free.length
      ? `${config.name}: akun ${username} dibuat dan memegang data yang sudah ada: ${deck.n} lagu di daftar putar, ${lists.n} playlist${moved ? ` (${moved} playlist dari browser lain ikut digabung)` : ''}.`
      : `${config.name}: akun ${username} dibuat. Belum ada data sebelumnya.`,
