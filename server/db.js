import mysql from 'mysql2/promise'

/**
 * Six tables:
 * - devices: one row per browser, keyed by its 12-character recovery code;
 * - songs: every YouTube video any list has held, with its title and artist, shared by all devices;
