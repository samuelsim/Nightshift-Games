# Estimate: first playable increment

## Decks and difficulty (current)

See the
[replayability repair](estimate-replayability.md): 90 factual cards, 42 generated templates,
Mixed Trivia, and unseen-first selection for regular room replays.

The lobby host can select Quantities, Mixed Trivia, Space Facts, Earth & Ocean or Wildlife and Easy, Standard or Hard. The default
remains Quantities / Standard. The host is automatically ready. A changed setting clears guest readiness; guests can
read the settings but cannot change them. The server rejects changes during play and validates
both option enums. Settings persist within the room, including automatic next-game starts.
Every round still lasts 30 seconds, with five rounds and unchanged accuracy/streak scoring.

Quantities has twelve Easy, eighteen Standard and twelve Hard templates. Each game selects
five templates and randomizes quantities. Each factual topic has ten cards per tier, totaling
90 facts. Mixed Trivia combines all three factual topics for thirty cards per tier. Regular
selection prioritizes unseen questions, then least recently presented questions in the room.
Generated number changes alone do not count as a new template. Daily selection ignores room
history so everyone receives the same versioned set. Difficulty is editorial, not a score multiplier.

Factual questions use explicitly stated units and positive, rounded reference values. Decimals
are accepted. Percentage questions expect 71 rather than 0.71; a question asking for millions
expects the number of millions. Approximate values receive continuous percentage-error points,
with no extra exact-match gate. Sources and answers are hidden until the corresponding reveal;
previous revealed results remain in history. A linked discovery card shows source and review date.

### Source review

Space Facts cards were checked on 2026-09-15 against these primary pages:

- [NASA Earth facts](https://science.nasa.gov/earth/facts/): atmosphere, oceans, orbital period, equatorial diameter and inner core.
- [NASA Moon facts](https://science.nasa.gov/moon/facts/): orbital period, radius and Apollo samples.
- [NASA Mars facts](https://science.nasa.gov/mars/facts/): rotation, orbital period and average solar distance.
- [NASA Jupiter facts](https://science.nasa.gov/jupiter/jupiter-facts/): relative width, orbital period and radius.
- [NASA Saturn facts](https://science.nasa.gov/saturn/facts/): orbital period and equatorial diameter.
- [NASA Sun facts](https://science.nasa.gov/sun/facts/): photosphere temperature and radius.

`estimate.facts.ts` stores stable card IDs, tiers, original question/explanation wording,
source URLs and review dates. The rounded source value is the scoring reference. No live
API, current-position widget, changing moon count or record-holder claim is used. Adding or
changing a card requires checking the linked source, units and rounding, updating its review
date, and retaining at least five distinct valid cards per tier. No external source content is
requested during gameplay; the link opens only when a player chooses it.

Records use `estimate:<deck>:<difficulty>:<solo|multiplayer|mixed>`. Old unqualified Estimate
records remain visible as Legacy quantities. A session changing player count at a round
boundary retains its deck/tier while moving to mixed participation records.

Verification: production build and all 86 tests pass. New coverage checks deck/tier privacy,
unique prompts, source metadata, fixed timings, settings authorization, readiness reset,
frozen game options, full transport play, automatic replay and separate persisted records.
Browser verification completed an Easy factual session with 1,274 points, displayed sources
only after reveal and saved exactly one matching local record. Desktop layout inspected;
no new mobile viewport verification is claimed. Earlier counts below are historical.

## Goal and scope

Prove a solo/duo game through the existing game contract, registry, authoritative Colyseus room,
and Angular renderer. Supports 1–8 players and five 30-second rounds. Pick a Number remains available.
The sections below document the original quantity-estimation increment; the current expansion is above.

## Rules

- Five questions are sampled from twelve original templates, with randomized quantities and shuffled order each session.
  Answers derive from explicit arithmetic, so they need no external factual source or database.
- Submit a finite number between 0 and 1,000,000,000, including decimals. Zero is a valid guess.
- One locked guess per player per round. Reveal when all connected players submit or the 30-second deadline expires.
- Percentage error = absolute difference / answer × 100.
- Base points = max(0, round(1,000 − 10 × percentage error)).
- A guess within 10% builds a streak. Consecutive qualifying guesses add 0, 100, 200, 300, 300 points.
  A miss or skipped round breaks the streak. The maximum session score is 5,900.
- Grades: within 1% Bullseye; within 10% Very close; within 25% In the ballpark; otherwise Wild guess.
- The smallest absolute error wins round bragging rights, including ties. Scores use the same
  accuracy formula for solo and multiplayer; there is no extra winner bonus.
- The host advances reveals. After final scores, next-game voting automatically starts another game
  after 15 seconds. The host can stop rotation and return to the lobby. Prior scores reset at each start.

## State and lifecycle

`SUBMISSION → REVEAL → SUBMISSION` repeats through round five, then `RESULTS` maps to the room scoreboard.
Answers and future questions remain in server-owned game state. Public views contain the current
question and submitted player IDs. Private views contain only the player's own submitted value and round.
Revealed answers, explanations and guesses are retained in session history.

Actions include the round number to reject delayed duplicate submissions or advance messages.
The server invokes the existing optional game tick every 250 ms. Estimate returns the same state
when nothing changed, avoiding redundant broadcasts. A waiting player disconnecting allows an
already-submitted round to reveal on the next tick. An empty round reveals at the deadline with no points. The room continues ticking even when everyone disconnects, so expired rounds can reveal before reconnect. Locked guesses still score after a disconnect.

A disconnected host retains control for ten seconds; their player seat remains reconnectable for 120 seconds. Fresh joins may participate in the current round if it is still
accepting guesses, otherwise they wait for the next round. Reconnected players cannot revise an
already-revealed round. No bots or spectators are introduced.

## Modules

- `libs/games/estimate`: pure state machine, prompt generation, scoring, views and tests.
- `libs/games/registry`: one additional definition entry and workspace dependency.
- `libs/protocol`: typed Estimate actions.
- `apps/game-server`: optional game tick invocation and two-client session smoke coverage.
- `apps/web`: Estimate renderer and room-page selection; existing client service sends actions.

## Verification

- `pnpm test`: 16 passing tests across four suites, including private views, invalid/stale actions,
  ties, scoring, streak cap/reset, five solo rounds, disconnect tick, and a two-client session
  through final scores, lobby return and replay. Existing Pick a Number tests still pass.
- `pnpm build`: production build passes. Angular requires execution outside the local sandbox
  due to ancestor-directory access. Existing `qrcode` and `ws` CommonJS warnings remain.
- `pnpm typecheck`: all workspace packages pass, including Angular development compilation.
- Browser smoke: create room, select Estimate, ready/start, five guesses, reveals, final scores,
  and return to lobby. No browser console errors. Mobile reveal visually checked at 390 × 844.

## Deferred

Daily challenges are now available; see [daily rules](daily-challenges.md). Custom decks are
on hold. Earth & Ocean and Wildlife are delivered; further topics remain future expansion. Reviewed factual
trivia, difficulty selection and browser-local personal bests are now delivered. PostgreSQL
remains unnecessary. Playtesting should guide further deck growth and difficulty calibration.
