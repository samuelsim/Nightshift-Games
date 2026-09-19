import type { GameMetadata } from '@nightshift/protocol';
export const oneOfUsMetadata: GameMetadata = {
  id: 'one-of-us', name: 'One of Us Is Lying', tagline: 'One player has no word. Everyone has something to say.',
  minPlayers: 3, maxPlayers: 8, supportsSolo: false, recommendedPlayers: [4, 5, 6],
  estimatedMinutes: 5, categories: ['social-deduction', 'bluffing', 'party']
};
