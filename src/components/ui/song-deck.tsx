/**
 * Song Deck: the card deal of Project Deck (scroll-stacking-cards.tsx, by Aakash Mehra) made into a
 * playlist. Each card is one song with its YouTube cover, and the card on top of the deck is the
 * song that plays: moving to another song deals its card onto the deck, and letting the scroll come
 * to rest on a card picks that song. The YouTube player rides on the active card, so the video
 * leans, blurs and sinks with it when the next card arrives.
 *
 * Same motion as the original (one spring-smoothed value drives every card, a still deck under
 * prefers-reduced-motion), measured in cards rather than in page progress, so adding or removing a
 * song never moves the card that is showing.
 */
import { memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref, type RefObject } from "react";
