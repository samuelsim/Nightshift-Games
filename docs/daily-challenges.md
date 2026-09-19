# Daily Estimate challenges

Choose **Play daily Estimate** on the home screen, or **Daily challenge** under Estimate's
lobby Play style. The home shortcut defaults to Quantities / Standard; the host may select
any deck and difficulty before guests ready up. The host is automatically ready. Switching style,
deck or difficulty resets guest readiness only. Guests see the settings; only the host may change them, only in the lobby.

## Identity and lifecycle

There are fifteen daily sets: five deck choices times three difficulty tiers. Each has five questions,
30 seconds per round and normal accuracy/streak scoring. The same set and order appear in
every room for the same date/deck/tier, independent of nicknames, player count or room random
state. Fact decks can reuse questions on later dates; new seed does not guarantee new content.

The server derives `v3:YYYY-MM-DD` from UTC at game creation. Version 2 gives each round
30 seconds; previous v1 daily records remain separate because those rounds allowed 15 seconds.
Version 3 expands the content pools and selection algorithm; older daily records remain separate.
UTC midnight is 08:00 in
Singapore. A game that crosses midnight retains its original date and questions. A new game,
including automatic replay after final scores, uses the current server date. Reconnects keep
the existing run and timers; an ended server process loses active rooms as before. Lobby daily
settings persist for subsequent Estimate elections, whose buttons visibly name Daily mode.

`estimate.daily.ts` hashes a version/date/deck/tier string into a deterministic PRNG. Prompt
creation uses that generator only for daily runs. `DAILY_VERSION` must be bumped when changing
existing daily decks, generation, order or rules that change the comparable challenge. Adding
a new deck namespace leaves existing sets unchanged and does not require a version bump. All servers
must run the same release for matching sets. Answers and future questions stay server-side;
the date is public. This is a reproducible casual challenge, not an anti-cheat system.

## Records

The record key is `daily:<version>:<date>:estimate:<deck>:<difficulty>:<participation>`.
Participation is solo, multiplayer or mixed using the existing round-boundary policy. First
means **first completed run observed by this browser**, not first attempt or first account play.
Replays may improve best score, but never overwrite the first completed score. A player leaving
before final scores does not save a result. Zero-point daily finishes count; spectators who
never participated do not acquire a score entry. Late joiners follow normal Estimate rules
and can earn a partial-session record; these records are not competitive rankings.

Local storage retains up to 180 daily rows separately from regular records. The home log shows
the latest 12 saved rows and offers the retained history. The most recent 200 run/seat keys
deduplicate repeated final-score observations. Multiple player seats share the browser profile's
collection; another seat's finish counts as another completed run. Clearing storage removes
records, and unavailable storage falls back to this visit's memory. No cloud leaderboard,
scheduled job or custom deck editor is included.

## Verification

Regression coverage includes independent rooms crossing midnight and automatic
replay, all fifteen deck/tier combinations, role-independent generation, zero finishes, record reload
deduplication, immutable first scores, version/date separation and daily-history retention.
Production build passes with existing qrcode/ws CommonJS warnings.

Browser verification completed a Standard Quantities daily with 457 points. Reloading final
scores and returning home retained exactly one finish and the same first score.
