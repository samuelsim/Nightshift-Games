export type PlayerId = string;

export interface Player {
  readonly id: PlayerId;
  readonly nickname: string;
  readonly avatarId: string;
  readonly connected: boolean;
  readonly ready: boolean;
  readonly host: boolean;
  readonly score: number;
  readonly joinedAt: number;
  readonly lastSeenAt: number;
}

export interface PlayerJoinOptions {
  readonly nickname: string;
  readonly avatarId: string;
}
