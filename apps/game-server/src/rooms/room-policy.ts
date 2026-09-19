import type { GameMetadata, Player, PlayerId } from '@nightshift/protocol';

export interface StartGamePolicyInput {
  readonly players: readonly Player[];
  readonly hostPlayerId: PlayerId;
  readonly requesterPlayerId: PlayerId;
  readonly game: GameMetadata;
}

export type PolicyDecision =
  | { readonly ok: true }
  | { readonly ok: false; readonly code: string; readonly message: string };

export function canStartGame(input: StartGamePolicyInput): PolicyDecision {
  if (input.requesterPlayerId !== input.hostPlayerId) {
    return {
      ok: false,
      code: 'host_only',
      message: 'Only the host can start the game.'
    };
  }

  const connectedPlayers = input.players.filter((player) => player.connected);

  if (connectedPlayers.length < input.game.minPlayers) {
    return {
      ok: false,
      code: 'not_enough_players',
      message: `${input.game.name} needs at least ${input.game.minPlayers} player(s).`
    };
  }

  if (connectedPlayers.length > input.game.maxPlayers) {
    return {
      ok: false,
      code: 'too_many_players',
      message: `${input.game.name} supports up to ${input.game.maxPlayers} players.`
    };
  }

  const unreadyPlayers = connectedPlayers.filter((player) => player.id !== input.hostPlayerId && !player.ready);

  if (unreadyPlayers.length > 0) {
    return {
      ok: false,
      code: 'players_not_ready',
      message: 'Waiting for the other players to ready up.'
    };
  }

  return { ok: true };
}

export function chooseNextHost(players: readonly Player[]): PlayerId | null {
  const connectedPlayers = players
    .filter((player) => player.connected)
    .sort((left, right) => left.joinedAt - right.joinedAt);

  return connectedPlayers[0]?.id ?? null;
}

export const hostGraceMs = 10_000;

export function hostAfterDisconnect(players: readonly Player[], hostId: string, now: number): string {
  const host = players.find(player => player.id === hostId);
  if (host?.connected || (host && now - host.lastSeenAt < hostGraceMs)) return hostId;
  return chooseNextHost(players) ?? hostId;
}
