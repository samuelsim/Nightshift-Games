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
