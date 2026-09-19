# Nightshift Games

Browser-first casual game platform for short, social, replayable sessions during night shifts.

## Hosting

Deploy the included `render.yaml` as a Render Blueprint for one free service with automatic
GitHub redeploys. See [the short deployment guide](docs/deployment.md).

## Milestone 1

This repository starts with the reusable platform loop:

- Angular web app
- Colyseus TypeScript game server
- Shared protocol and game-core packages
- Short room code create/join flow
- Lobby with nicknames, avatars, readiness, host controls
- Reconnection token storage
- Generic game registration
- A tiny `Pick a Number` game to prove the flow

## Milestone 2: Estimate — first playable increment

Choose **Estimate** in the lobby and start a five-round solo or multiplayer session. The host
is automatically ready; guests ready up before starting. Estimate setting changes reset guests only.
Generated quantity questions change their values and order each game. Lock a guess, compare
percentage error at reveal, build accuracy streaks, and return to the lobby to play again.

See [Estimate rules and scope](docs/estimate.md) for scoring, lifecycle decisions, verification, and deferred features.

## Milestone 3: More games and continuous play

- **Restricted Clues** (2–8): four timed rounds with private words, forbidden clues, and rotating clue givers.
- **Human.exe** (1–8): five rounds of original choices with private human/machine directives.
- **Estimate** now draws five questions from twelve generated templates.
- **Pick a Number** now rejects stale rounds and resolves waiting-player disconnects.
- Everyone can vote for the next game during play. Final scores stay up for 15 seconds,
  then the most-voted eligible game starts automatically. The host can stop rotation from the vote panel.

See [game pool and continuous-play rules](docs/game-pool.md).

## Milestone 4: Majority Rules and One of Us Is Lying

- **Majority Rules** (2–8): choose your answer and predict the other players' majority; five
  rounds from thirty original prompts. Correct predictions earn 100 points.
- **One of Us Is Lying** (3–8): three rounds of private words, simultaneous clues, timed
  discussion and secret accusation ballots; thirty word/category pairs and rotating bluffers.
- Both games support the existing automatic next-game election and load their screens on demand.

Their [backlog entries](docs/backlog.md) are now marked implemented. See the
[game pool](docs/game-pool.md) for rules, lifecycle behaviour and verification.

## Visual and sound feedback

Game cards now have distinct accents and emblems, with clearer focus, selection, reveal,
and winning-score states. A shared round strip shows progress and timed-phase countdowns.
Brief confirmations announce accepted submissions, votes, point gains, and final scores.

Use **Sound off** in the top bar to enable quiet synthesized game cues. Sound is off by
default, the preference is saved locally, and hidden tabs suppress new sounds. Motion
respects the device's reduced-motion setting. All seven game screens load on demand.

See [feedback behaviour](docs/feedback.md) for implementation and verification details.

The [2026-09-15 code/docs review](docs/review-2026-09-15.md) records discrepancies,
completed fidelity touch-ups, verification, and remaining deferred scope.

## Continuity and personal records

A disconnected host gets ten seconds to return before control transfers to another connected
player. Their player seat remains reconnectable for two minutes. Finished games now save
browser-local personal bests, finish counts and total points, separated by solo/multiplayer
mode. See [the phased larger-features plan](docs/larger-features.md) for details and next steps.

## Human.exe: Infiltrator

Choose **Human.exe: Infiltrator** with 3–8 players for three rounds of anonymous responses
and private accusations. One hidden machine must slip a secret word into its answer.
Write in 30 seconds, discuss for 20, then vote in 20. Catching the machine awards correct
human voters 100 points; escaping earns the machine 200. The mode has its own illustrated
stage, sound cues and quick rules. The original Human.exe remains available for solo play
and directive rounds. See [Phase 2 rules and verification](docs/larger-features.md).

## Estimate decks and difficulty

Select **Estimate** in the lobby to choose **Quantities**, **Space Facts**, **Earth & Ocean**
or **Wildlife**; choose **Mixed Trivia** to combine all factual topics. Then select Easy, Standard or Hard. Every session has five 30-second rounds. The three
factual decks contain 90 reviewed questions and reveal sources after answers lock. Quantities has
42 templates across the three tiers. Regular play uses unseen questions first in the room.
Personal records distinguish deck and difficulty;
automatic replays keep the room's settings. See [Estimate rules and sources](docs/estimate.md).

## Daily challenges

Use **Play daily Estimate** on the home screen for a shared daily set, solo or with friends.
All five deck choices and all difficulty tiers support daily play. Sets reset at 00:00 UTC; games already
underway keep their original date. Your browser saves first completed score, replay best and
finish count in a separate daily log. See [daily rules](docs/daily-challenges.md).
Custom decks remain on hold.

## Replayability update

Human.exe now has 28 scenarios with shuffled answer positions, extra decoys and avoidance
of the room's last fifteen presented questions. Estimate's factual topics have distinct
illustrations and sound palettes. See [the incremental delivery notes](docs/replayability-pass.md)
for content, validation and the remaining broader polish pass.

## Local development

Use the bundled or local `pnpm`.

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

The web app defaults to `http://localhost:4200`.
The Colyseus server defaults to `http://localhost:2567`.
