import type { GameMetadata } from '@nightshift/protocol';
export const humanExeMetadata: GameMetadata = {
  id: 'human-exe', name: 'Human.exe', tagline: 'Human instinct or machine logic? Follow your secret directive.',
  minPlayers: 1, maxPlayers: 8, supportsSolo: true, recommendedPlayers: [1, 2, 3, 4],
  estimatedMinutes: 3, categories: ['solo-duo', 'party', 'guessing']
};
