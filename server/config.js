import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Repo root, one level above /server. */
export const ROOT = fileURLToPath(new URL('..', import.meta.url))

// .env is optional: the variables can also be set in the shell.
if (existsSync(ROOT + '.env')) process.loadEnvFile(ROOT + '.env')

const str = (key, fallback) => process.env[key] || fallback
const num = (key, fallback) => {
  const value = Number(process.env[key])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

