# Visual and aural feedback

Current review: see [the documentation alignment audit](review-2026-09-15.md).
Verification counts and bundle sizes under earlier increments below are historical snapshots.

Phase 2 adds a seventh palette for Human.exe: Infiltrator, a masked-machine emblem,
scanning radar stage, anonymous response-card entrances and identity-reveal outcomes.
Accepted response and private-vote locks use the shared confirmation cues. All three timed
phases use the shared urgency sounds; quick rules remain available throughout play.

The shared feedback layer uses public room transitions for accepted submissions, next-game
votes, game/round starts, reveals, personal point gains, and completion. Initial snapshots
and reconnects stay silent. Other players' submissions do not trigger personal lock cues;
private roles and answers are never inspected by this layer.

Sound is opt-in through the top-bar toggle and saved as `nightshift.sound` in local storage.
Web Audio creates short per-game sine, triangle, or square tones only after a user gesture; there are no audio downloads
or background music. Muting silences the master gain immediately. Hidden tabs skip new
cues, and unavailable audio or storage does not block gameplay. Countdowns warn at ten seconds, tick at five and four, and double-beep for the final three seconds when sound is enabled. A falling tone marks an observed expiry; phase transitions retain their own cues. Timer sounds use a stronger triangle tone and cannot be swallowed by click throttling.

Game accents, emblems, selection borders, keyboard focus rings, reveal entrances, winner
highlights, and a shared round/timer strip reinforce the game state. Transient messages use
a polite live region; timers do not continuously announce updates. Reduced-motion settings
disable animation and transitions, retaining static feedback.

Historical verification for the initial feedback increment: nine feedback tests cover event deduplication, own-player submissions and
ballots, score/completion transitions, audio opt-in, hidden-tab suppression, immediate mute,
and unavailable audio. The full 53-test suite and production build pass. Desktop and
390px-wide browser checks cover home, lobby, round reveals, sound controls, final scores,
and the next-game countdown. No browser warnings or errors appeared in the checked flow.

The illustrated arcade adds six original SVG characters: a guessing cup, a shushing speech
bubble, a robot, a crowd, a masked ghost, and a smiling die. They appear on the home shelf,
lobby game cards, and the active game stage. Hover tilts and reveal celebrations respect
reduced motion. The lobby uses a three-column gallery on desktop and a single column on
small phones. Desktop and 390px browser checks showed no horizontal overflow or console
errors. The production initial bundle remains below 500 kB (495.98 kB).

## Personal outcomes and quick rules

All six games now map their revealed public results to a persistent personal result card
and distinct correct, close, or incorrect cues. Estimate uses its accuracy bands rather
than treating every positive score as success. Human.exe uses the authored directive
answer; Majority Rules uses the prediction outcome; One of Us distinguishes a correct
suspicion from a group win. Missing answers and voided rounds get neutral feedback.
Restricted Clues also confirms new clues and provides retry feedback for wrong guesses.
Initial/reconnect snapshots remain silent. Published results drive cues independently of
room score patch timing. Phase transitions bring the result card into view.

A fixed How to play disclosure is available in the lobby, during rounds and at final
scores. It follows the selected/active game and provides a short explanation plus scoring.
It supports keyboard and touch interaction, and explicitly says that timers keep running.

Verification for this pass: 60 tests pass, including seven public-outcome tests covering
all games and expanded synthesized-audio checks. Production build passes (initial bundle
about 455 kB after loading the room route on demand). Browser checks exercised exact and
inaccurate Estimate results and the rules disclosure on desktop and 390px mobile layouts.

## Per-game fidelity pass

Each game now has an original illustrated stage and a distinct synthesized sound palette:
Estimate uses measuring tools and bright chimes; Pick a Number has dice and fast triangle
notes; Restricted Clues has speech bubbles, a vault and high soft notes; Human.exe uses
circuits, a scanning display and quieter square-wave bleeps; Majority Rules has opposing
charts and a fanfare; One of Us has a magnifying glass, case file and lower suspense tones.
The public selected/active game selects the palette. Private roles never change the sound.
Timer warnings retain their standard pattern. Test sound previews the current palette.

Reveals trigger short game-specific scene animations, and personal result cards use themed
labels and treatments. Motion is finite and disabled by reduced-motion preferences. Stages
load on demand. Production build and all 17 feedback tests pass; the Pick a Number stage,
reveal and themed result card were checked in the browser.

## Documentation alignment touch-ups

Unsubmitted solo Pick a Number and Human.exe rounds now use neutral no-response feedback,
matching the missing-answer policy above. Submitted misses still receive incorrect feedback.
One of Us confirms accepted local discussion messages with a lock cue and toast; new discussion
rows have a brief entrance animation. Initial snapshots and unchanged messages remain silent.

Timed entry controls close locally at the deadline, while the server remains authoritative.
Restricted Clues now shows six clue slots, the remaining allowance, and an exhausted state
that disables only the giver's form. Guessers can continue until solve or timeout.
