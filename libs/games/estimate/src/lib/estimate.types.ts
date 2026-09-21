import type { PlayerId } from '@nightshift/protocol';

export type EstimateSpaceSubject = 'sun' | 'moon' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';
export type EstimateAnimalSubject = 'cheetah' | 'komodo-dragon' | 'giant-panda' | 'red-panda' | 'two-toed-sloth' | 'sloth-bear' | 'asian-elephant' | 'aldabra-tortoise';
export type EstimateArtSubject = EstimateSpaceSubject | EstimateAnimalSubject
  | 'ocean' | 'water' | 'ice' | 'steam' | 'atmosphere' | 'seafloor'
  | 'handshake' | 'printer' | 'coins' | 'tile' | 'robot' | 'music' | 'lift' | 'clock'
  | 'biscuit' | 'tap' | 'cinema' | 'duck' | 'chair' | 'ribbon' | 'sticker' | 'square'
  | 'hat' | 'chest' | 'train' | 'sunflower' | 'bread' | 'bicycle' | 'star' | 'sock'
  | 'doughnut' | 'marbles' | 'balloon' | 'puzzle' | 'spaceship' | 'rice' | 'wheel'
  | 'trophy' | 'box' | 'ferry' | 'photo' | 'dragon' | 'garden' | 'paint' | 'cup'
  | 'pond' | 'map' | 'cube' | 'telescope' | 'download' | 'badge' | 'price' | 'snail' | 'bolt' | 'tank';

export interface EstimatePrompt {
  /** Authored subject only. Never infer art from answers or private state. */
  readonly art?: EstimateArtSubject;
  readonly artMeasure?: 'radius' | 'diameter';
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
  readonly prompt: Pick<EstimatePrompt, 'question' | 'unit' | 'convention' | 'art' | 'artMeasure'>;
  readonly submittedPlayerIds: readonly PlayerId[];
  readonly scores: EstimateState['scores'];
  readonly latestResult: EstimateResult | null;
  readonly history: readonly EstimateResult[];
}

export interface EstimatePlayerView {
  readonly round: number;
  readonly submittedValue: number | null;
}
