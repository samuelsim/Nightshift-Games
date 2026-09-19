export type GameCategory =
  | 'solo'
  | 'solo-duo'
  | 'party'
  | 'competitive'
  | 'cooperative'
  | 'social-deduction'
  | 'trivia'
  | 'puzzle'
  | 'drawing'
  | 'bluffing'
  | 'reaction'
  | 'guessing';

export interface GameMetadata {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly supportsSolo: boolean;
  readonly recommendedPlayers: readonly number[];
  readonly estimatedMinutes: number;
  readonly categories: readonly GameCategory[];
}
