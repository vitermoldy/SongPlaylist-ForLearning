import express from 'express'

/**
 * The API:
 *   GET /api/health              is the server up, and is MySQL connected
 *   GET /api/state/:code         a device's deck and saved playlists ({ saved: false } before its first save)
