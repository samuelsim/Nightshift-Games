# Replayability and Quick start pass

Quick start defaults now have a compact, click/tap/keyboard-accessible disclosure beside
the start controls. It derives round counts, deck and difficulty labels from the shared
settings schema, then explains timing and solo/multiplayer differences. Escape closes it.

| Game | Assessment and change |
| --- | --- |
| Estimate | Existing factual decks and room history remain. Add 24 generated templates across all three tiers (66 templates total), covering geometry, scaling, recipes, tournaments, travel and probability. Keep 30-second rounds. |
| Human.exe | Grow from 28 to 40 scenarios with social, travel, games and everyday situations. Prefer unseen scenarios through the entire pool, then oldest replays, rather than forgetting after 15 questions. Both difficulties keep correct answer remapping. |
| Restricted Clues | Double the deck from 20 to 40 words, with forbidden pairs spanning food, objects, animals and activities. Remember shown words across games. |
| Majority Rules | Expand from 30 to 50 dilemmas beyond the workplace. Remember shown prompts. Add reveal headlines for unanimity, ties and one-vote margins. |
| One of Us Is Lying | Expand from 30 to 50 words. Use six shared categories with at least five words each, so remembering one category does not identify its word. Remember shown words without exposing them in public state. |
| Infiltrator | Expand from 12 to 36 writing prompts and 12 to 24 code words, including less obviously robotic words. Remember shown prompts. Roles and code words remain private. |
| Pick a Number | Keep its compact rules and scoring. Add a pulsing solo search indicator and visually cross out numbers eliminated by higher/lower hints. Preserve multiplayer behaviour and existing direction sounds. |

## Replay selection

`freshHand` in game-core selects unseen cards first, followed by least recently shown,
then shuffles the hand. A server-only `GameDefinition.replayKey` identifies the current
card; the room records it once per round and passes that game's history through
`GameContext.previousContent`. Abandoning a game marks only presented cards, not the
unseen remainder. History survives lobby returns, game switches and automatic rotation,
but expires when the room is destroyed or the server restarts. It is never replicated
to clients. Each game's history is bounded to 1,000 identities.

Estimate retains its template-aware selection and independent Daily path. Generated
content changed, so Daily identity advances to v4: sets remain deterministic within a
version/date/deck/difficulty, and older daily records remain separate and readable.

Validation covers 30 distinct cards over three long runs per party deck, exhaustion
ordering, secret-word privacy, abandoned-game replay history, default settings, full
round lifecycles, Daily determinism and the existing multiplayer regression suite.
