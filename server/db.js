import mysql from 'mysql2/promise'

/**
 * Six tables:
 * - devices: one row per browser, keyed by its 12-character recovery code;
 * - songs: every YouTube video any list has held, with its title and artist, shared by all devices;
 * - decks: a device's player state: the current song, volume, the playlist the deck was opened from,
 *   and `client_updated`, the browser's time of its last change (the newer copy wins);
 * - deck_songs: the songs on a device's deck, in order;
 * - playlists: a device's saved playlists;
 * - playlist_songs: the songs of each saved playlist, in order.
 * Deleting a device removes everything of it (ON DELETE CASCADE); songs stay as a shared catalogue.
 */
const TABLES = [
  `CREATE TABLE IF NOT EXISTS devices (
    id CHAR(12) PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS songs (
    video_id VARCHAR(16) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    accent CHAR(7) NULL,
    problem VARCHAR(200) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS decks (
    device_id CHAR(12) PRIMARY KEY,
    current_video VARCHAR(16) NULL,
    volume TINYINT UNSIGNED NOT NULL DEFAULT 80,
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    linked_playlist VARCHAR(40) NULL,
    client_updated BIGINT NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT decks_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
