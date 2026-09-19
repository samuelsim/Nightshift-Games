# Game pool and continuous play

Current update: [Phases 1–3](larger-features.md) deliver ten-second host handoff, browser-local personal records, Human.exe: Infiltrator and Estimate decks/difficulty. Earlier milestone/deferred notes below describe their original scope.

## Delivered increment

Seven registered games now share room creation, readiness, host controls, private views, tick
updates, scores, next-game voting and automatic rotation. No database or extra service is required.

| Game | Players | Session | Rules |
| --- | --- | --- | --- |
| Estimate | 1–8 | 5 rounds, 30 seconds each | Quantities, Space Facts, Earth & Ocean or Wildlife; Easy/Standard/Hard, regular or daily. Accuracy scores and streak bonuses. See [deck details](estimate.md). |
| Pick a Number | 1–8 | 3 rounds | Solo: three guesses in 20 seconds, higher/lower hints, 100/60/30 points. Multiplayer: closest earns 5, exact earns 8; ties share the win. |
| Restricted Clues | 2–8 | 4 rounds, up to 60 seconds each | One player sees a secret word and two forbidden words. They send up to six one-word clues; everyone else guesses. |
| Human.exe | 1–8 | 5 rounds | 28 scenarios, shuffled answers and recent-question avoidance. Solo: classify both responses in 15 seconds for match and speed points. Multiplayer: follow a private HUMAN or MACHINE directive. |
| Human.exe: Infiltrator | 3–8 | 3 rounds; 30s writing, 20s discussion, 20s voting | Write anonymous responses, hide a machine's secret word, then privately accuse a response. Correct human voters earn 100 when caught; escaping machine earns 200. |
| Majority Rules | 2–8 | 5 rounds, 30 seconds to submit | Choose A/B and predict the other players' majority. Correct predictions earn 100 points. |
| One of Us Is Lying | 3–8 | 3 rounds | One bluffer receives only a category; everyone gives a clue, discusses and privately votes for the bluffer. |

## Restricted Clues

Twenty original word cards are shuffled; four are used per session. The clue giver rotates
through connected players. A correct guess awards 100 points to both the guesser and giver,
then reveals the word. Incorrect guesses cost nothing. The server allows one guess per player
per 750 ms and retains the latest twelve guesses for display. Clues must be distinct words
of 2–24 letters, cannot contain an answer/forbidden word, and cannot be a fragment of one.
Wordplay, spelling hints and gestures are handled by the displayed honour rule, not semantic AI.

Timeouts or clue-giver departures reveal without points. With fewer than two players at the next
round boundary, the game finishes early. Late arrivals may guess immediately. The host advances
reveals and opens final scores. Secret cards are sent only to the giver and are absent from browser code.

## Human.exe multiplayer

Eight original scenarios supply five shuffled rounds. Each connected player receives a random
HUMAN or MACHINE directive each round. HUMAN asks for warmth, empathy or shared humour;
MACHINE asks for measurement, structured data or system status. Matching the authored answer
earns 100 points. Each player locks one choice; only submitted IDs are public until reveal.
The reveal shows directives, choices, points and an explanation. The multiplayer maximum score is 500.

This is a first directive-and-reveal mode, not a CAPTCHA replica or a claim to measure real humanity.
Hidden infiltrator deduction and anonymous in-game voting are now available as the separate
**Human.exe: Infiltrator** choice. See [Phase 2](larger-features.md) for its role privacy,
deadlines, tie rules, disconnect handling and verification. Richer visual challenges remain deferred.
The next-game voting described below is separate platform functionality.

## Majority Rules

Thirty original two-option prompts supply five distinct prompts per session. Each player locks
an answer and a prediction of the other submitted answers: A, B or a tie. Their own answer is
excluded from their scoring target. With two participants the tie prediction is unavailable.
A correct prediction earns 100 points; with no other submitted answers, no points are awarded.

Answers and predictions remain private until everyone still connected has submitted or the
30-second deadline expires. Already locked answers count after disconnect. Round participants
are snapshotted; late joins wait for the next round. Below two connected players at a next-round
boundary, the session ends early. The host advances reveals and opens final scores.

## One of Us Is Lying

Thirty original word/category pairs supply three distinct cards per session. One randomly chosen
bluffer receives only the category; informed players receive the word. The bluffer rotates without
repeats until all available players have had a turn.

- Clues: up to 30 seconds; one locked clue per participant, one to three English words, at most
  60 characters. Answer-containing clues are rejected, including attempts to split the answer
  with spaces. Clues are revealed together when connected participants submit or time expires.
- Discussion: 30 seconds, with an optional shared text feed. Each participant can send four
  messages, at most 160 characters each, at least one second apart. The feed retains up to 32
  messages per round. Angular renders messages as text, never as HTML.
- Voting: up to 20 seconds; one locked private ballot for another round participant. Self-votes
  and outsider targets are rejected. Reveal when everyone connected has voted or time expires.
- A unique highest-voted player is accused. Ties and empty votes produce no accusation. If the
  bluffer is caught, each informed player who voted correctly earns 100 points. Otherwise the
  bluffer earns 200. Reveals identify the word, bluffer, accusation, ballots and awarded points.

Late joins wait for the next round. A permanent bluffer departure or fewer than three connected
round participants voids the round without points. With four or more participants, a temporary
drop can reconnect while at least three remain; deadlines continue. Locked clues and ballots
are retained. Below three connected players at the next-round boundary ends the session early.
The host advances reveals. Secret game ballots are independent of public next-game votes.

## Continuous-play election

- Starts when a game starts. Any connected player, including guests, can vote.
- One ballot per player. Selecting another game replaces the ballot; repeated clicks do not add votes.
- The current game is available as an explicit replay choice.
- Votes remain editable through the 15-second final scoreboard.
- At the deadline the server selects the eligible game with the most votes. Readiness is not
  requested again during continuous play; returning to the lobby restores the normal ready-up flow.
- Ties are random among the tied leaders. With no valid votes, choose another eligible game
  at random; replay is the fallback if no alternative exists.
- Eligibility uses the connected player count at transition time. Invalid or disconnected-player
  ballots do not count. Ballots, the countdown and scores reset when the new game starts.
- Host controls allow ending the current game or cancelling the scoreboard rotation and returning
  to the lobby. Without connected players the countdown pauses. Room state remains ephemeral.

## Implementation boundaries

New packages: `libs/games/restricted-clues` and `libs/games/human-exe`, each with metadata,
pure rules, public/private views and tests. The registry exposes a metadata-only browser catalogue.
Room schema adds ballots and a deadline. `next-game-policy.ts` owns pure election rules; the
Colyseus room owns the countdown. Angular uses one reusable vote panel and a small display clock.

Existing-game refinements include more Estimate templates and round identity/disconnect handling
for Pick a Number. Accepted new interactions clear earlier local error messages.

## Verification and remaining scope

Pure rule tests cover privacy, ownership, malformed/stale actions, scoring, completed sessions,
timers, disconnects, late joins, ballot replacement, ties and eligibility. A real two-client
Colyseus test plays four Restricted Clues rounds, elects Human.exe, waits for automatic startup,
and verifies ballot/score reset. Existing Estimate and Pick a Number smoke flows remain covered.

Browser checks cover two-player private views, clue delivery and guessing, role rotation, live
votes, the final countdown, automatic Human.exe startup and both directives scoring correctly.
Human.exe and the vote panel were visually checked at a 390 × 844 viewport. New game and
scoreboard transitions reset scroll position so mobile players do not land halfway down the page.
The Milestone 3 automated suite contained 30 passing tests across seven suites.
The production browser bundle excludes the new secret decks. Build still reports the existing
`qrcode` and `ws` CommonJS warnings.

At that milestone, deferred features included persistent personal bests, factual Estimate trivia, difficulty settings,
custom decks, richer Human.exe deduction/voting, and a host-disconnect policy beyond the existing
reconnect window. This increment should be playtested before expanding those features.

## Milestone 4 delivery and verification

`libs/games/majority-rules` and `libs/games/one-of-us` add pure game rules, typed public/private
views, separate metadata and server-owned content. Their Angular renderers reuse a common
scoreboard, styles, display clock and the existing vote panel. A shared shuffle utility avoids
duplicating deck randomisation. No room-engine changes or new external dependencies were needed.

- **44 passing tests across nine suites**, including the prior games. New rule tests cover
  scoring, ties, deadlines, private information, invalid/stale/duplicate actions, late joins,
  voided rounds, limited discussion, role rotation and completed sessions.
- A real three-client Colyseus test completes Majority Rules, elects One of Us Is Lying, runs
  all three deduction rounds and returns to the lobby. It verifies privacy and scoring through
  the transport. An injected test clock advances Date deadlines while normal room ticks run,
  keeping tests fast without changing production durations.
- A two-tab browser check verifies Majority Rules' duo scoring and hidden choices. A three-tab
  check verifies informed/bluffer views, simultaneous clues, delivered discussion messages,
  hidden ballots and correct caught-bluffer scoring. Both reveal layouts were checked at a
  390 × 844 viewport; no browser console errors were observed.
- Production build and peer-dependency check pass. The two new screens load only when their
  game starts. Initial bundle size remains below the existing 500 kB warning budget. The
  existing `qrcode` and `ws` CommonJS warnings remain. Content markers from the new decks
  are absent from the generated browser JavaScript.

Custom prompts/decks, public matchmaking, voice chat, extra deduction roles and persistent
statistics remain deferred as specified in the original backlog.

## Solo challenges

When a round starts with one connected player, Pick a Number becomes a 20-second hunt:
three distinct guesses at a fixed secret number from 1–10, higher/lower hints after misses,
and 100/60/30 points for finding it on attempt one/two/three. Three misses or timeout earns
zero. The target stays server-side until reveal. The session remains three rounds.

Human.exe becomes a 15-second dual-classification challenge: choose two different options
for HUMAN and MACHINE, then lock the pair. Each correct classification earns 100 points;
getting both right adds 10 points per full second remaining. Timeout earns zero. The
session remains five rounds. The reveal shows both selected and authored answers.

Modes are fixed for each round. A player joining a solo round watches until the next round,
which uses the original multiplayer rules when at least two players are connected.
Countdowns, hints, personal outcome cards and quick rules support the solo variants.
Server validation covers late, invalid and duplicate moves; targets and authored answers
stay hidden until reveal. All 66 tests and the build pass. Browser checks exercised a full
three-guess hunt and a successful Human.exe pair earning a speed bonus.

## Fidelity follow-up

- Human.exe solo uses response assignment cards with Human/Machine status lights and a
  short assignment sound. Pick a Number uses three chance diamonds, animated hint tickets,
  and ascending/descending sounds for higher/lower hints.
- Personal correct results receive a brief star burst and points animation. All added
  animations respect the existing reduced-motion preference; sounds respect mute settings.
- Estimate reveals include a personal accuracy gauge with an exact-answer marker, a
  ±10% band, and numerical error. Majority Rules reveals animate the full A/B vote split,
  explicitly distinguishing it from the prediction scoring against other players.
- One of Us reveals use a stamped case file with the bluffer and accused player. The
  scoreboard has a trophy illustration and solo, winning, tied, or zero-score summary.
- Removed the old eight-second cap from the next-game countdown display so it shows the
  actual server countdown, including the full fifteen-second voting interval.
- Verification: all 67 regression tests pass. Browser checks exercised Human.exe card
  assignment and an Estimate reveal (15 versus 14: 7.1% error, 929 points).
