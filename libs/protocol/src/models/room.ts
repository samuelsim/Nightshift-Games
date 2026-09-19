import type { GameMetadata } from './game-metadata';
import type { Player } from './player';

export type RoomPhase = 'LOBBY' | 'INSTRUCTIONS' | 'PLAYING' | 'SCOREBOARD';
export type EstimateDeck = 'generated' | 'facts' | 'earth' | 'wildlife' | 'mixed';
export const estimateDeckLabels: Readonly<Record<EstimateDeck, string>> = {
  generated: 'Quantities', facts: 'Space Facts', earth: 'Earth & Ocean', wildlife: 'Wildlife', mixed: 'Mixed Trivia'
};

export interface EstimateOptions {
  readonly daily?: boolean;
  readonly deck: EstimateDeck;
  readonly difficulty: 'easy' | 'standard' | 'hard';
}

export interface ActiveGameView {
  readonly runId?: string;
  readonly mode?: string;
  readonly gameId: string;
  readonly phase: string;
  readonly round: number;
  readonly timerEndsAt: number;
  readonly publicView: unknown;
  readonly viewVersion: number;
}

export interface RoomView {
  readonly estimateOptions?: EstimateOptions;
  readonly code: string;
  readonly phase: RoomPhase;
  readonly hostPlayerId: string;
  readonly selectedGameId: string;
  readonly players: readonly Player[];
  readonly games: readonly GameMetadata[];
  readonly activeGame: ActiveGameView | null;
  readonly nextGameVotes: Readonly<Record<string, string>>;
  readonly nextGameStartsAt: number;
}
