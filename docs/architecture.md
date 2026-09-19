# Architecture

Current update: [Phase 1](larger-features.md) delivers ten-second host handoff and browser-local personal records. Earlier milestone/deferred notes below describe their original scope.

Nightshift Games is split into platform responsibilities and individual game implementations.

## Platform Responsibilities

- Room creation and short room codes
- Player join, leave, readiness, host assignment, and reconnect display
- Lobby and game selection
- Authoritative game start and return-to-lobby flow
- Per-player next-game votes and automatic rotation after a fifteen-second scoreboard
- Shared score display
- Public room state synchronization
- Private player-specific view messages

## Game Responsibilities

- Game-specific state
- Rules and valid actions
- Round and phase transitions
- Scoring
- Public and private player views
- Prompt/content selection

## Shared State Strategy

Colyseus schema state is used for public platform state that every connected client may see. Private game information such as secret words, roles, or individual instructions must stay in server-owned plain TypeScript game state and be sent only through targeted player view messages.

This keeps the protocol simple while avoiding accidental leaks from synchronized room state.

## Game Registration

Games export a `GameDefinition` object. The registry maps game IDs to definitions. The server only depends on the registry and game-core contracts. Angular renders game-specific UI separately, keyed by game ID.

The browser imports the separate metadata-only `@nightshift/games-registry/catalog` entry point.
Server definitions and secret content must not be reachable through that entry point.

Adding a game should usually mean:

1. Add a package under `libs/games/<game-id>`.
2. Export its `GameDefinition`.
3. Add one registry entry.
4. Add a web renderer under `apps/web/src/app/games/<game-id>`.

## Persistence

Active room state remains in Colyseus memory. Personal and daily records use browser-local
storage. Daily Estimate sets derive from a versioned UTC seed on the server, so no scheduled
job or database is needed. PostgreSQL remains deferred until cloud persistence is in scope.

## Local Runtime Pin

The web app is pinned to Angular 21.2.22 for Milestone 1 because the bundled local Node runtime is v24.14.0 and Angular 22 requires v24.15.0 or newer on the Node 24 line. Once the local runtime is upgraded, the intended path is to move the Angular packages back to the current active major.
