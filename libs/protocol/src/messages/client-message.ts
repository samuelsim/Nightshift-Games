export interface SetReadyMessage {
  readonly type: 'SET_READY';
  readonly ready: boolean;
}

export interface SelectGameMessage {
  readonly type: 'SELECT_GAME';
  readonly gameId: string;
}

export interface StartGameMessage {
  readonly type: 'START_GAME';
}

export interface ReturnToLobbyMessage {
  readonly type: 'RETURN_TO_LOBBY';
}

export interface GameActionMessage {
  readonly type: 'GAME_ACTION';
  readonly action: PlayerAction;
}

export type ClientMessage =
  | { readonly type: 'SET_ESTIMATE_OPTIONS'; readonly deck: import('../models/room').EstimateDeck; readonly difficulty: 'easy' | 'standard' | 'hard'; readonly daily?: boolean }
  | { readonly type: 'VOTE_NEXT_GAME'; readonly gameId: string }
  | SetReadyMessage
  | SelectGameMessage
  | StartGameMessage
  | ReturnToLobbyMessage
  | GameActionMessage;

export type PlayerAction =
  | { readonly type: 'INFILTRATOR_RESPOND'; readonly round:number; readonly text:string }
  | { readonly type: 'INFILTRATOR_VOTE'; readonly round:number; readonly cardId:string }
  | { readonly type: 'INFILTRATOR_NEXT'; readonly round:number }
  | { readonly type: 'MAJORITY_SUBMIT'; readonly round: number; readonly choice: 'A' | 'B'; readonly prediction: 'A' | 'B' | 'TIE' }
  | { readonly type: 'MAJORITY_NEXT' | 'LYING_NEXT'; readonly round: number }
  | { readonly type: 'LYING_CLUE' | 'LYING_DISCUSS'; readonly round: number; readonly text: string }
  | { readonly type: 'LYING_VOTE'; readonly round: number; readonly targetPlayerId: string }
  | { readonly type: 'CLUES_GIVE' | 'CLUES_GUESS'; readonly round: number; readonly text: string }
  | { readonly type: 'CLUES_NEXT' | 'HUMAN_NEXT'; readonly round: number }
  | { readonly type: 'HUMAN_CHOOSE'; readonly round: number; readonly choice: number }
  | { readonly type: 'HUMAN_SOLO_SUBMIT'; readonly round: number; readonly humanChoice: number; readonly machineChoice: number }
  | EstimateSubmitAction
  | EstimateNextRoundAction
  | PickNumberSubmitAction
  | PickNumberNextRoundAction
  | UnknownPlayerAction;

export interface PickNumberSubmitAction {
  readonly round: number;
  readonly type: 'PICK_NUMBER_SUBMIT';
  readonly value: number;
}

export interface PickNumberNextRoundAction {
  readonly round: number;
  readonly type: 'PICK_NUMBER_NEXT_ROUND';
}

export interface UnknownPlayerAction {
  readonly type: string;
  readonly [key: string]: unknown;
}

export interface EstimateSubmitAction {
  readonly type: 'ESTIMATE_SUBMIT';
  readonly round: number;
  readonly value: number;
}

export interface EstimateNextRoundAction {
  readonly type: 'ESTIMATE_NEXT_ROUND';
  readonly round: number;
}
