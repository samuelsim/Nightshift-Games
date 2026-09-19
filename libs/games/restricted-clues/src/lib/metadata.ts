import type { GameMetadata } from '@nightshift/protocol';
export const restrictedCluesMetadata: GameMetadata = {
  id: 'restricted-clues', name: 'Restricted Clues', tagline: 'One secret word. Two words you absolutely cannot say.',
  minPlayers: 2, maxPlayers: 8, supportsSolo: false, recommendedPlayers: [2, 3, 4, 5, 6],
  estimatedMinutes: 4, categories: ['party', 'cooperative', 'guessing']
};
