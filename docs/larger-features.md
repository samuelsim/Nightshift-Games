# Larger features: phased delivery

## Phase 1 — continuity and personal records (implemented)

Host control transfers after ten seconds of disconnection to the earliest-joined connected
player. A return before that deadline retains control; after handoff, the returning player
keeps their identity and score but does not automatically reclaim host status. Permanent
departure still transfers immediately. With no replacement connected, the current seat
remains reserved. The server retries selection on ticks, including in the lobby. A room
banner displays the grace countdown and announces the new host. Reconnect seats remain
reserved for 120 seconds; game clocks continue independently.

Personal records are stored in localStorage under `nightshift.personalStats.v1`. The home
screen shows best session score, finished-game count and total points per game/mode.
The final scoreboard announces a first finish or a new best. Scores come from the final
public game score map; spectators without a score entry and games abandoned to the lobby
are excluded. Early finishes produced by game rules count. A player must observe final
scores to save their result; there is no offline result delivery.

Each game start has a server-generated UUID. Saving is deduplicated by UUID and player seat,
including refresh/reconnect. A bounded list keeps the latest 200 saved seat/run keys;
aggregate bests/counts/totals remain. Zero-point finishes count when the game publishes a
score entry. Solo and multiplayer records are separate. Runs switching modes at round
boundaries use a separate mixed category. Mode is derived from the game variant for Human.exe
and Pick a Number, and connected player count at round starts for the other games.

Records belong to the browser profile, not the nickname. Multiple local player seats share
that collection. There are no accounts, server rankings or cross-device synchronization.
Clearing site data removes records; blocked storage falls back to in-memory records for
the current visit. Records are personal progress indicators, not cheat-resistant scores.

Verification: production build and all 74 tests pass. A real transport test drops a host,
advances beyond the grace period, exercises replacement host controls, and reconnects the
original player without stealing host back. Storage tests cover replay deduplication,
serialization, corrupt data, zero scores and mode separation. Browser check: completed a
three-round solo Pick a Number session with 90 points, refreshed at final scores, then saw
exactly one finish and a 90-point best/total on the home screen.

## Phase 2 — richer Human.exe gameplay (implemented)

**Human.exe: Infiltrator** is a separate lobby and next-game choice for 3–8 players.
The original Human.exe directive and solo challenges remain available. Three rounds use
distinct original workplace prompts; the hidden machine rotates without repeats while
eligible players remain. Everyone writes a short response, but the machine must naturally
include a privately supplied whole word.

Each round gives 30 seconds to write, 20 seconds to read/discuss aloud, and 20 seconds to
vote. Responses lock once and appear together as shuffled anonymous cards. Only each
author knows their own card. Accusation ballots stay private until reveal; self-votes and
stale-round actions are rejected. A unique leading card accuses its author. Correct human
voters earn 100 points when the machine is caught; an escaping machine earns 200. A tied
vote lets the machine escape. No ballots, fewer than three responses, or a missing machine
response voids the round. A permanent machine departure or fewer than three connected
round participants also voids it; late arrivals join at the next round. Below three players
at the next boundary ends the session early. The host advances reveals.

The mode includes a masked-machine illustration, scanning stage, animated anonymous cards,
private directive panel, identity-reveal feedback, its own sound palette and always-available
quick rules. Shared mute/reduced-motion settings, local records and next-game voting apply.
Discussion is aloud or through the players' existing call; this mode has no text chat.

Verification: 82 automated tests pass. A three-client transport test completes all three
rounds, checks secret roles/responses/ballots and scoring, then elects and automatically
starts the next game. Browser testing verifies three players submitting, reading anonymous
cards, casting private ballots and receiving the correct identity reveal and points.
Production build passes with existing qrcode/ws CommonJS warnings. Mobile viewport
verification remains pending because the browser override did not change the rendered width.

## Phase 3 — factual Estimate and difficulty (implemented)

Estimate has host-controlled lobby options for **Quantities** or **Space Facts**, each with
Easy, Standard and Hard tiers. Settings are shared with every player, locked outside the
lobby, and retained when Estimate wins the next-game election. Changing settings resets
readiness. The vote panel names the configured deck and difficulty.

Space Facts contains 18 reviewed NASA-based questions, six per tier; five distinct cards
are shuffled into each session. Easy uses familiar planetary facts; Standard covers sizes,
orbital periods and temperature; Hard uses less familiar dimensions and quantities.
These are editorial difficulty assignments, not calibrated ratings. Quantities retains the
12 original Standard templates and adds six Easy and six Hard templates. Easy uses short
calculations; Hard adds conversions, percentages and multi-step reasoning.

All combinations retain five 30-second rounds and the same percentage-error/streak scoring.
Sources, explanations and answers remain server-side until their round reveals. Each factual
card carries its source URL, review date, units and answer convention. The reveal shows a
linked discovery card. Values are rounded references and use the existing continuous score,
not a binary factual-answer tolerance. The app makes no live source requests.

Records distinguish deck, difficulty and solo/multiplayer/mixed participation. Existing
Estimate records remain readable as Legacy quantities rather than being silently merged
with new runs. Verification: build and 86 tests pass, including two-client settings
authorization, malformed options, readiness reset, reveal privacy, five-round play and
automatic replay. A browser run completed Space Facts / Easy and saved one 1,274-point
solo record; source cards and the 15-second final countdown were visible. New factual
deck markers are absent from compiled browser JavaScript. Existing qrcode/ws warnings remain.

See [Estimate](estimate.md) for source provenance and current content boundaries.

## Phase 4a — daily challenges (implemented)

Estimate now offers daily challenges for all four decks and all three difficulty tiers. A home
card creates a daily Estimate lobby; the host can also choose Daily in the existing Play style
selector. Each version/UTC date/deck/tier has the same five questions across rooms and player
counts. Regular mode remains a fresh random shuffle. Custom decks are on hold at the user's request.

The server fixes the daily identity at game creation, using its UTC date. An in-progress run
keeps that identity across midnight, disconnects and round transitions. New starts, including
automatic replay, use the new UTC date. Versioned deterministic generation lives only in the
server game package; answers and future questions are not published before reveal. No cron
job, source fetch, account or database is required. Fifteen-second rounds and existing scoring,
sound cues and reconnect rules apply. Daily does not add games outside Estimate in this release.

Daily records are separate from regular scores and keyed by version, date, deck, difficulty
and solo/multiplayer/mixed participation. They preserve the first completed score, best score
and completed-run count. Replays count, but refreshing the same final scoreboard does not.
Abandoned runs are not finishes; a daily run completed with all timeouts counts as zero.
The latest 180 daily record rows are retained separately from the 100 regular record slots.
Records belong to this browser profile; they are personal progress, not a ranked competition.

Verification at initial delivery: 91 tests passed. Coverage now includes all twelve daily sets across differing player
counts and RNGs, UTC boundaries, preserved in-progress identity, zero-score completion,
version/date/mode record separation, first-score preservation and bounded history. A real
two-room transport test crosses UTC midnight, finishes both original sets and automatically
starts matching sets for the new day. See [daily challenge details](daily-challenges.md).

## Deferred

Custom decks remain on hold. Cloud accounts/statistics and public matchmaking require a
separate deployment/persistence scope. Voice chat and extra deduction roles remain lower priority.
