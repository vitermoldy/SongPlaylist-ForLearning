# SongPlaylist-ForLearning

A song playlist built on a scroll-dealt card deck. Each song is a card with its YouTube cover; the
card on top of the deck is the song that plays. Moving to another song (next, the song ending, a pick
from the list) deals its card onto the deck: it rises from below leaning toward you and out of focus,
then flattens and sharpens as it lands, while the cards beneath lean back and dim. Stopping the
scroll on a card picks that song.

The card motion comes from "Project Deck" by Aakash Mehra (`scroll-stacking-cards`, a 21st.dev
component, integrated from `prompt.txt`). The original component is kept as given in
`src/components/ui/scroll-stacking-cards.tsx`; the playlist version is `song-deck.tsx`.

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, `motion`, `lucide-react`, the YouTube IFrame
Player API, and a small local server (Express 5 and MySQL 8) that keeps a copy of the lists. No
YouTube API key is needed.

## What it does

- Plays songs from YouTube links: a video, a YouTube Music link, a Short, or a public playlist
  (`youtube.com/playlist?list=...`, up to 50 songs). Titles and artists come from YouTube's oEmbed.
- One YouTube player rides on the active card, so the video moves, blurs and dims with it.
- Player bar: previous (or back to the start after 3 seconds), play or pause, next, position,
  volume, full screen. A song that ends moves on to the next card by itself.
- Kelola lagu: add a link, jump to a song, open it on YouTube, remove it, save the list as a
  playlist, or empty the list.
- Playlist: saved lists under a name. Play one (it replaces the list, with a question first when
  the current list was never saved), update the one that was opened, save as new, delete one, or
  delete all. Emptying the list never deletes saved playlists, and deleting playlists never empties
  the list.
- Each card's play button takes its colour from the song's cover, deepened until the white icon
  on it reads at 4.5:1 or better.
- Server lokal: a copy of everything in MySQL, and a recovery code to carry it to another browser.
- Reduced motion: cards appear in place, no travel or blur.

## Run it

```bash
npm install
cp .env.example .env   # fill in DB_USER and DB_PASSWORD of your MySQL account
npm run server         # API on http://localhost:8811; creates the database and its tables
npm run dev            # http://localhost:5195; /api is forwarded to the server
```

After `npm run build`, `npm start` serves `dist/` and the API on one port (8811). `dist/` uses
relative paths, so it can also go on a static host as is; without the server the page works on the
browser's own storage.

## Server and database


## Structure

```
components.json                     shadcn config: @/components, @/components/ui, @/lib/utils
src/App.tsx                         state: songs, active song, saved playlists, what the page keeps in view
src/components/ui/song-deck.tsx     the playlist deck: card motion, scroll-to-pick, the card the player rides on
src/components/ui/scroll-stacking-cards.tsx   the original Project Deck, unchanged
src/components/player-bar.tsx       transport under the deck
src/components/songs-dialog.tsx     "Kelola lagu" panel
src/components/playlists-dialog.tsx "Playlist" panel
src/components/sheet.tsx            side panel on <dialog>, and the in-place confirm
src/components/add-song-form.tsx    the link form, with its busy, error and done states
src/hooks/use-youtube-player.ts     one IFrame player, loaded on the first play
src/lib/youtube.ts                  link parsing, oEmbed, IFrame API loader, playlist reading
src/lib/add-link.ts                 a pasted link into songs, with a sentence saying what happened
src/lib/playlist.ts                 Song and SavedPlaylist types, sample songs, localStorage
src/lib/color.ts                    accent colour from a cover
```

## Why `components/ui`

shadcn's CLI (`npx shadcn add ...`) and components copied from shadcn-style libraries import each
other through `@/components/ui/...` and `@/lib/utils`. Keeping that folder and those aliases (in
`components.json`, `tsconfig.json` and `vite.config.ts`) means another component can be pasted or
added without rewriting its imports.

## Notes

- Some videos refuse to play outside YouTube (the owner turned embedding off). They are caught when
  added, or skipped with a message when YouTube refuses them at play time.
- YouTube's own mixes (links with `list=RD...`), Watch later and Liked videos cannot be read as
  playlists outside YouTube.
- On some phones (iOS Safari above all) the first song may need one tap on the video itself; the
  player bar says so when that happens.
