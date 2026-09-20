# Game Authoring

Games are pure TypeScript modules. They should not import Angular, Colyseus rooms, Express, or persistence code.

Each game exports a `GameDefinition`:

- `metadata`
- `createInitialState`
- `start`
- `handleAction`
- `getPublicView`
- `getPlayerView`
- optional `tick`
- optional `isFinished`

The server passes a `GameContext` containing players, current time, and random number generation. The game returns either an accepted state update or a rejected action with a player-facing error.

Private information belongs in the game state and `getPlayerView`, not in public Colyseus state.

The room calls optional `tick` every 250 ms while playing. Return the original state object
when nothing changes; the room only republishes changed states. Include a round identifier
in actions that must not be replayed into a later round. See Estimate for an example.

Put metadata in a separate module without importing the definition. Register it in
`libs/games/registry/src/catalog.ts` for the browser; register the definition in the registry's
`index.ts` for the server. Browser imports must use `@nightshift/games-registry/catalog`.
Import game view types with `import type` so private decks and answers stay out of browser bundles.

The room owns next-game voting and the fifteen-second scoreboard transition. Games only need
to return a finished state; they do not tally next-game votes or create another game themselves.

## Host settings

Declare finite-choice settings in `libs/protocol/src/models/game-options.ts`. Each field defines
its key, label, default and typed choices. The shared lobby component renders these fields;
the server validates patches against the same definition. New fields do not need a new
message type or per-game lobby markup. Read them through `GameContext.gameOptions` in the
engine, and add coverage for the resulting gameplay. For score-affecting settings, extend
the room's record mode and the browser's record validation/labels to keep bests comparable.

All seven games accept 1–10 rounds. Defaults remain Estimate/Human.exe/Majority Rules: 5;
Restricted Clues: 4; Pick a Number/One of Us Is Lying/Infiltrator: 3. Human.exe offers Easy
(the two correct candidates, no decoys) and Standard (the existing decoys). Estimate retains
deck, difficulty and daily choices; daily challenges always use five rounds.

Only the host can update the selected game's settings, and only in the lobby. Settings are
stored per game for the room's lifetime and reused by next-game voting. An actual change
resets guest readiness; a no-op does not. The host stays ready. Default settings expose a
single Quick start action. For custom settings, solo hosts can Quick start with defaults;
with guests, Use defaults resets settings first and allows guests to ready again before start.

Custom round counts and Human.exe Easy scores use separate personal-record modes. Default
records and daily identities remain compatible with prior versions.
