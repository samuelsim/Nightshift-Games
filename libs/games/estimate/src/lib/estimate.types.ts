import type { PlayerId } from '@nightshift/protocol';

export interface EstimatePrompt {
  readonly source?: { readonly title: string; readonly url: string; readonly reviewedAt: string };
  readonly convention?: string;
  readonly question: string;
  readonly unit: string;
  readonly answer: number;
  readonly explanation: string;
}

export interface EstimateResult {
  readonly round: number;
  readonly prompt: EstimatePrompt;
  readonly guesses: readonly {
    playerId: PlayerId;
    value: number;
    errorPercent: number;
    grade: string;
    points: number;
    streak: number;
  }[];
  readonly winners: readonly PlayerId[];
}

export interface EstimateState {
  readonly dailyId: string;
  readonly deck: import('@nightshift/protocol').EstimateDeck;
  readonly difficulty: 'easy' | 'standard' | 'hard';
  readonly timerEndsAt: number;
  readonly phase: 'SUBMISSION' | 'REVEAL' | 'RESULTS';
  readonly round: number;
  readonly prompts: readonly EstimatePrompt[];
  readonly submissions: Readonly<Record<PlayerId, number>>;
  readonly scores: Readonly<Record<PlayerId, number>>;
  readonly streaks: Readonly<Record<PlayerId, number>>;
  readonly history: readonly EstimateResult[];
}

export interface EstimatePublicView {
  readonly dailyId: string;
  readonly deck: EstimateState['deck'];
  readonly difficulty: EstimateState['difficulty'];
  readonly timerEndsAt: number;
  readonly phase: EstimateState['phase'];
  readonly round: number;
  readonly maxRounds: number;
  readonly prompt: Pick<EstimatePrompt, 'question' | 'unit' | 'convention'>;
  readonly submittedPlayerIds: readonly PlayerId[];
  readonly scores: EstimateState['scores'];
  readonly latestResult: EstimateResult | null;
  readonly history: readonly EstimateResult[];
}

export interface EstimatePlayerView {
  readonly round: number;
  readonly submittedValue: number | null;
}
