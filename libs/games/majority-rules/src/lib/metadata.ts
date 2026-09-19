import type { GameMetadata } from '@nightshift/protocol';
export const majorityRulesMetadata: GameMetadata = {
  id: 'majority-rules', name: 'Majority Rules', tagline: 'Pick your side. Predict everyone else.',
  minPlayers: 2, maxPlayers: 8, supportsSolo: false, recommendedPlayers: [3, 4, 5, 6],
  estimatedMinutes: 3, categories: ['party', 'guessing', 'competitive']
};
