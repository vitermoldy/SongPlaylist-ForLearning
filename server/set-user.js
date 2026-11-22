import { randomInt } from 'node:crypto'
import { hashPassword, PASSWORD_MAX, PASSWORD_MIN, USERNAME } from './auth.js'
import { config } from './config.js'
import { connect } from './db.js'

/**
 * `npm run set-user -- <username> <kata sandi>`: makes an account, or gives an existing
 * one a new password (there is no reset by email, so this is the reset). A new account
 * takes over the lists saved before accounts existed: the newest browser's deck, plus the
 * saved playlists of every other browser nobody owns yet, so none of them is left behind.
