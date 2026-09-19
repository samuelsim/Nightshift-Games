import type { GameMetadata } from '@nightshift/protocol';
export const pickNumberMetadata: GameMetadata = {
    id: 'pick-number',
    name: 'Pick a Number',
    tagline: 'Choose 1-10. The server has feelings about which number mattered.',
    minPlayers: 1,
    maxPlayers: 8,
    supportsSolo: true,
    recommendedPlayers: [1, 2, 3, 4, 5, 6],
    estimatedMinutes: 2,
    categories: ['solo', 'solo-duo', 'party', 'guessing']
  };
