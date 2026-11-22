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
Player API. No server and no API key: everything is kept in the browser's localStorage.

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
- Reduced motion: cards appear in place, no travel or blur.

## Run it

```bash
npm install
npm run dev       # http://localhost:5195
npm run build     # type check, then a static site in dist/
npm run preview   # serve dist/ on port 5195
```

`dist/` uses relative paths, so it can go on any static host as is.

## Structure

```
components.json                     shadcn config: @/components, @/components/ui, @/lib/utils
