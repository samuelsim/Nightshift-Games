import type { GameMetadata } from '@nightshift/protocol';
export const estimateMetadata: GameMetadata = {
    id: 'estimate', name: 'Estimate', tagline: 'Big guesses. Tiny margin for bragging.',
    minPlayers: 1, maxPlayers: 8, supportsSolo: true, recommendedPlayers: [1, 2],
    estimatedMinutes: 3, categories: ['solo', 'solo-duo', 'guessing']
  };
