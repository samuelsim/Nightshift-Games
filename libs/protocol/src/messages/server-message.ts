export interface ErrorServerMessage {
  readonly type: 'ERROR';
  readonly code: string;
  readonly message: string;
}

export interface PrivateViewServerMessage {
  readonly type: 'PRIVATE_VIEW';
  readonly gameId: string;
  readonly view: unknown;
}

export interface HostChangedServerMessage {
  readonly type: 'HOST_CHANGED';
  readonly playerId: string;
}

export type ServerMessage =
  | ErrorServerMessage
  | PrivateViewServerMessage
  | HostChangedServerMessage;
