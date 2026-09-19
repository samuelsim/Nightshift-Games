import type { GameMetadata, PlayerAction, PlayerId } from '@nightshift/protocol';
import type { GameContext } from './game-context';

export interface GameError {
  readonly code: string;
  readonly message: string;
}

export interface GameAccepted<TState> {
  readonly ok: true;
  readonly state: TState;
}

export interface GameRejected<TState> {
  readonly ok: false;
  readonly state: TState;
  readonly error: GameError;
}

export type GameActionResult<TState> = GameAccepted<TState> | GameRejected<TState>;

export interface GameDefinition<TState, TAction extends PlayerAction, TPublicView, TPlayerView> {
  readonly metadata: GameMetadata;
  createInitialState(context: GameContext): TState;
  start(state: TState, context: GameContext): GameActionResult<TState>;
  handleAction(
    state: TState,
    playerId: PlayerId,
    action: TAction,
    context: GameContext
  ): GameActionResult<TState>;
  tick?(state: TState, context: GameContext): GameActionResult<TState>;
  isFinished(state: TState): boolean;
  getPublicView(state: TState, context: GameContext): TPublicView;
  getPlayerView(state: TState, playerId: PlayerId, context: GameContext): TPlayerView;
}

export type AnyGameDefinition = GameDefinition<unknown, PlayerAction, unknown, unknown>;
