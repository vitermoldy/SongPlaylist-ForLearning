# Design

Direction: the owner chose the Project Deck component (prompt.txt) and asked for its cards to become
a song playlist whose song changes look like the card deal. The deck's own look is therefore the
direction; everything added around it follows it.

## Palette

| Role | Value | Why |
| --- | --- | --- |
| Ground | `#E7E8EA` | The deck's page ground; the cut-out corner is filled with it, so the button sits "in" the card. |
| Ink | `#111318` / `#141414` | Titles, buttons. |
| Secondary text | `#3B3F48` | Artist lines, hints. 9:1 on the ground. |
| Panels | `#F3F4F5`, white | Side panels and the player bar sit one step lighter than the ground. |
| Danger | `#8F1A1A` | Delete and clear actions, errors. 7.6:1 on white. |
| Accent | per song | Read from the song's cover and deepened until a white icon reads at 4.5:1. The music's own colour marks its play button, the way the original used each site's brand colour for its arrow. |

Light only: the covers and videos carry the colour, and the deck's corner cut-outs depend on the
light ground.

## Type

The system sans stack, as in the original component. The covers carry the identity; the type stays
plain so titles read at any length. Big closing headline (`clamp(40px, 7vw, 104px)`, tight tracking)
