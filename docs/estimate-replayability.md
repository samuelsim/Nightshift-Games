# Estimate replayability repair — 2026-09-19

Previously each factual topic/tier had six questions and a game used five, without remembering
earlier games. Overlapping replays were inevitable. Daily mode also intentionally reused its set.

## Current behavior

- 90 factual cards: 30 each in Space Facts, Earth & Ocean and Wildlife; ten per difficulty.
- Mixed Trivia combines the three topics: 30 questions per difficulty. A fresh room can play
  six complete five-round games at one difficulty before seeing a repeated fact.
- Quantities has 42 templates: twelve Easy, eighteen Standard and twelve Hard, with random numbers.
- Regular games prioritize unseen questions, then least recently presented questions. Number
  changes alone do not count as a fresh Quantities template. The selected five are shuffled.
- The server remembers up to 1,000 recently presented question strings in the room. History
  survives returns to the lobby, automatic replays and topic changes. Abandoned games only
  count questions actually shown. Reconnects preserve the room; new rooms/server restarts reset it.
- Daily mode ignores room history and explicitly warns that replays repeat its set. The expanded
  content and selection algorithm use daily version v3, preserving prior-version records separately.
- Every round still allows 30 seconds. Scoring and existing multiplayer rules are unchanged.

## Sources for added trivia

Questions cite their individual primary source after reveal. Values were reviewed on 2026-09-19;
wording specifies rounded figures, upper range limits and units.

- NASA: [Mercury](https://science.nasa.gov/mercury/facts/), [Venus](https://science.nasa.gov/venus/venus-facts/), [Neptune](https://science.nasa.gov/neptune/neptune-facts/), [Uranus](https://science.nasa.gov/uranus/facts/), [Earth](https://science.nasa.gov/earth/facts/).
- NOAA: [mid-ocean ridge](https://oceanservice.noaa.gov/facts/midoceanridge.html), [ocean formation](https://oceanservice.noaa.gov/facts/why_oceans.html).
- Smithsonian National Zoo: [cheetah](https://nationalzoo.si.edu/animals/cheetah), [giant panda](https://nationalzoo.si.edu/animals/giant-panda), [Asian elephant](https://nationalzoo.si.edu/animals/asian-elephant), [Aldabra tortoise](https://nationalzoo.si.edu/animals/aldabra-tortoise).

The pool is finite: repeats eventually return, particularly in a single topic/tier. Mixed Trivia
offers the longest cycle. History is room-local, not an account-wide claim of unseen content.

## Validation

97 regression tests pass, including eight regular replays for every deck/tier, six distinct
Mixed Trivia games per tier, daily independence from history, and two completed multiplayer
games with ten distinct questions shared by both clients. Production build passes (existing
qrcode/ws CommonJS warnings). Added content markers are absent from browser JavaScript.
Browser smoke verified the Mixed Trivia selector, Fresh shuffle guidance, 30-second timer,
exact-guess scoring and source reveal. Localhost is running for playtesting.
