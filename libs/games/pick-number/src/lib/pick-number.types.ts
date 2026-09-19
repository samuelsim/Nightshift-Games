import type { PlayerId } from '@nightshift/protocol';

export type PickNumberPhase = 'SUBMISSION' | 'REVEAL' | 'RESULTS';

export interface PickNumberSubmission {
  readonly playerId: PlayerId;
  readonly value: number;
}

export interface PickNumberRoundResult {
  readonly round: number;
  readonly target: number;
  readonly submissions: readonly PickNumberSubmission[];
  readonly winners: readonly PlayerId[];
  readonly pointsAwarded: Readonly<Record<PlayerId, number>>;
}

export interface PickNumberState {
  readonly solo?: { playerId: string; target: number; attempts: readonly {value:number;hint:string}[] } | null;
  readonly timerEndsAt?: number;
  readonly phase: PickNumberPhase;
  readonly round: number;
  readonly maxRounds: number;
  readonly target: number | null;
  readonly submissions: Readonly<Record<PlayerId, number>>;
  readonly scores: Readonly<Record<PlayerId, number>>;
  readonly history: readonly PickNumberRoundResult[];
}

export interface PickNumberPublicView {
  readonly solo?: { playerId: string; attempts: readonly {value:number;hint:string}[] } | null;
  readonly timerEndsAt?: number;
  readonly phase: PickNumberPhase;
  readonly round: number;
  readonly maxRounds: number;
  readonly target: number | null;
  readonly submittedPlayerIds: readonly PlayerId[];
  readonly scores: Readonly<Record<PlayerId, number>>;
  readonly latestResult: PickNumberRoundResult | null;
  readonly history: readonly PickNumberRoundResult[];
}

export interface PickNumberPlayerView {
  readonly submitted: boolean;
  readonly submittedValue: number | null;
}
