import type { Player, PlayerId } from '@nightshift/protocol';

export interface GameContext {
  readonly gameOptions?: import('@nightshift/protocol').GameOptions;
  readonly previousEstimateQuestions?: readonly string[];
  readonly previousHumanQuestions?: readonly string[];
  readonly estimateOptions?: import('@nightshift/protocol').EstimateOptions;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly now: number;
  readonly random: () => number;
  readonly hostPlayerId: PlayerId;
}

export function getConnectedPlayers(players: ReadonlyMap<PlayerId, Player>): readonly Player[] {
  return Array.from(players.values()).filter((player) => player.connected);
}
