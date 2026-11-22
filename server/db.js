import mysql from 'mysql2/promise'

/**
 * Six tables:
 * - devices: one row per browser, keyed by its 12-character recovery code;
