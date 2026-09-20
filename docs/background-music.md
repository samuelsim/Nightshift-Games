# Background music

Eight original instrumental arrangements are synthesised locally with Web Audio. There
are no audio downloads, external services or licensed recordings. Each sixteen-bar loop
has melody, bass, sustained chords, phrase rests and a contrasting middle section.

| Scene | Theme | Feel |
| --- | --- | --- |
| Menu and lobby | After-hours lounge | Warm, relaxed triangle melody and soft rhythm |
| Estimate | Curiosity cabinet | Bright, sparse bell-like sine notes |
| Pick a Number | Lucky little shuffle | Bouncy arcade melody and light percussion |
| Restricted Clues | Sneaky little clues | Playful minor-key plucks |
| Human.exe | Soft circuits | Fast, quiet electronic arpeggios |
| Infiltrator | Undercover signal | Slow, spacious minor-key suspense |
| Majority Rules | Room full of opinions | Upbeat, friendly major-key groove |
| One of Us Is Lying | A curious alibi | Measured detective-style pulse |

Music is enabled by default but creates its AudioContext only after a user interaction.
The Audio menu provides independent music and effects switches, persistent music volume,
the current track name and the existing sound test. Music fades between scenes; a lobby
or home return restores the menu theme. Scoreboards keep the current game's music.

The effects service notifies the music controller when an important cue is actually
played, ducking music briefly beneath timers, reveals and results. Hidden tabs stop music
voices and scheduling; returning starts a fresh phrase without playing queued notes.
Voices disconnect after ending, and destruction clears the scheduler and closes audio.

`music-score.ts` holds compositions, `music-engine.ts` schedules envelopes with a short
look-ahead window, and `music.service.ts` owns preferences and browser lifecycle. Add a
game theme by registering its game ID; unknown scenes fall back to menu music.

Validation covers all eight arrangements, finite frequencies/durations/gains, independent
preferences, theme changes, hidden-tab recovery, ducking and cleanup. Browser checks
cover menu/game/lobby transitions, saved controls and the 320px-wide Audio menu.
