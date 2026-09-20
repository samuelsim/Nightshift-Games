import { MapSchema, Schema, defineTypes } from '@colyseus/schema';

export class PlayerSchema extends Schema {
  declare id: string;
  declare nickname: string;
  declare avatarId: string;
  declare connected: boolean;
  declare ready: boolean;
  declare host: boolean;
  declare score: number;
  declare joinedAt: number;
  declare lastSeenAt: number;

  constructor() {
    super();
    this.id = '';
    this.nickname = '';
    this.avatarId = '';
    this.connected = true;
    this.ready = false;
    this.host = false;
    this.score = 0;
    this.joinedAt = 0;
    this.lastSeenAt = 0;
  }
}

defineTypes(PlayerSchema, {
  id: 'string',
  nickname: 'string',
  avatarId: 'string',
  connected: 'boolean',
  ready: 'boolean',
  host: 'boolean',
  score: 'number',
  joinedAt: 'number',
  lastSeenAt: 'number'
});

export class ActiveGameSchema extends Schema {
  declare runId: string;
  declare mode: string;
  declare gameId: string;
  declare phase: string;
  declare round: number;
  declare timerEndsAt: number;
  declare publicViewJson: string;
  declare viewVersion: number;

  constructor() {
    super();
    this.gameId = '';
    this.runId = '';
    this.mode = '';
    this.phase = '';
    this.round = 0;
    this.timerEndsAt = 0;
    this.publicViewJson = '';
    this.viewVersion = 0;
  }
}

defineTypes(ActiveGameSchema, {
  runId: 'string',
  mode: 'string',
  gameId: 'string',
  phase: 'string',
  round: 'number',
  timerEndsAt: 'number',
  publicViewJson: 'string',
  viewVersion: 'number'
});

export class NightshiftRoomState extends Schema {
  declare gameOptionsJson: string;
  declare estimateDeck: string;
  declare estimateDaily: boolean;
  declare estimateDifficulty: string;
  declare code: string;
  declare phase: string;
  declare hostPlayerId: string;
  declare selectedGameId: string;
  declare players: MapSchema<PlayerSchema>;
  declare activeGame: ActiveGameSchema;
  declare nextGameVotes: MapSchema<string>;
  declare nextGameStartsAt: number;

  constructor() {
    super();
    this.gameOptionsJson = '{}';
    this.code = '';
    this.phase = 'LOBBY';
    this.hostPlayerId = '';
    this.selectedGameId = 'pick-number';
    this.estimateDeck = 'generated';
    this.estimateDaily = false;
    this.estimateDifficulty = 'standard';
    this.players = new MapSchema<PlayerSchema>();
    this.activeGame = new ActiveGameSchema();
    this.nextGameVotes = new MapSchema<string>();
    this.nextGameStartsAt = 0;
  }
}

defineTypes(NightshiftRoomState, {
  gameOptionsJson: 'string',
  estimateDeck: 'string',
  estimateDaily: 'boolean',
  estimateDifficulty: 'string',
  code: 'string',
  phase: 'string',
  hostPlayerId: 'string',
  selectedGameId: 'string',
  players: { map: PlayerSchema },
  activeGame: ActiveGameSchema,
  nextGameVotes: { map: 'string' },
  nextGameStartsAt: 'number'
});
