import mysql from 'mysql2/promise'

/**
 * Six tables:
 * - devices: one row per browser, keyed by its 12-character recovery code;
 * - songs: every YouTube video any list has held, with its title and artist, shared by all devices;
 * - decks: a device's player state: the current song, volume, the playlist the deck was opened from,
