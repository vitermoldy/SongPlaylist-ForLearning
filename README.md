# SongPlaylist-ForLearning

A song playlist built on a scroll-dealt card deck. Each song is a card with its YouTube cover; the
card on top of the deck is the song that plays. Moving to another song (next, the song ending, a pick
from the list) deals its card onto the deck: it rises from below leaning toward you and out of focus,
then flattens and sharpens as it lands, while the cards beneath lean back and dim. Stopping the
scroll on a card picks that song.

The card motion comes from "Project Deck" by Aakash Mehra (`scroll-stacking-cards`, a 21st.dev
component, integrated from `prompt.txt`). The original component is kept as given in
`src/components/ui/scroll-stacking-cards.tsx`; the playlist version is `song-deck.tsx`.

