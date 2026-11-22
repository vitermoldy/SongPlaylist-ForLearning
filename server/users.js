import { config } from './config.js'
import { connect } from './db.js'

/** `npm run users`: who has an account, when they joined, and what they keep. */
const when = (d) => (d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-')

const pool = await connect(config.db)
const [rows] = await pool.query(
  `SELECT u.username, u.created_at, u.last_login_at, u.last_seen_at, u.login_count,
     (SELECT COUNT(*) FROM deck_songs d WHERE d.device_id = u.device_id) AS deck,
     (SELECT COUNT(*) FROM playlists p WHERE p.device_id = u.device_id) AS playlists
   FROM users u ORDER BY u.created_at`,
)
