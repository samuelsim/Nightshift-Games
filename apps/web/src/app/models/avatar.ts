export interface AvatarOption {
  readonly id: string;
  readonly label: string;
  readonly initials: string;
  readonly color: string;
}

export const avatarOptions: readonly AvatarOption[] = [
  { id: 'moon', label: 'Moon', initials: 'MO', color: '#8ef5c3' },
  { id: 'spark', label: 'Spark', initials: 'SP', color: '#ffcd5c' },
  { id: 'radar', label: 'Radar', initials: 'RA', color: '#73d9ff' },
  { id: 'bean', label: 'Bean', initials: 'BE', color: '#ff6f91' },
  { id: 'bolt', label: 'Bolt', initials: 'BO', color: '#c7a7ff' },
  { id: 'mug', label: 'Mug', initials: 'MU', color: '#f7f5ef' }
];

export function getAvatar(avatarId: string): AvatarOption {
  return avatarOptions.find((avatar) => avatar.id === avatarId) ?? avatarOptions[0]!;
}
