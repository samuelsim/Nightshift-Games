import { Injectable, computed, inject, signal } from '@angular/core';
import { FeedbackService } from './feedback.service';
import { roomFeedback } from './feedback-event';
import { PersonalStatsService } from './personal-stats.service';
import { Client, Room } from '@colyseus/sdk';
import { environment } from '../../environments/environment';
import {
  NightshiftRoomState,
  type ActiveGameView,
  type ClientMessage,
  type GameMetadata,
  type PlayerAction,
  type Player,
  type PlayerJoinOptions,
  type RoomView,
  type ServerMessage
} from '@nightshift/protocol';
import { gameCatalog } from '@nightshift/games-registry/catalog';

const reconnectionStorageKey = 'nightshift.reconnectionToken';

@Injectable({ providedIn: 'root' })
export class GameClientService {
  private readonly feedback = inject(FeedbackService);
  private readonly stats = inject(PersonalStatsService);
  private readonly client = new Client(environment.colyseusUrl);
  private room: Room<NightshiftRoomState> | null = null;

  readonly roomView = signal<RoomView | null>(null);
  readonly privateView = signal<unknown>(null);
  readonly connectionStatus = signal<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('idle');
  readonly lastError = signal<string | null>(null);
  readonly playerId = signal<string | null>(null);
  readonly isHost = computed(() => this.roomView()?.hostPlayerId === this.playerId());

  async createRoom(options: PlayerJoinOptions): Promise<string> {
    this.connectionStatus.set('connecting');
    const room = await this.client.create<NightshiftRoomState>('nightshift_room', options);
    this.attachRoom(room);
    return room.roomId;
  }

  async joinRoom(code: string, options: PlayerJoinOptions): Promise<void> {
    this.connectionStatus.set('connecting');
    const room = await this.client.joinById<NightshiftRoomState>(code.trim().toUpperCase(), options);
    this.attachRoom(room);
  }

  async reconnectFromSession(): Promise<boolean> {
    // Routing from create/join already has a live connection. Reconnect is only
    // needed after a reload or a lost connection, not on every room-page entry.
    if (this.room && this.connectionStatus() === 'connected') return true;

    const token = sessionStorage.getItem(reconnectionStorageKey);

    if (!token) {
      return false;
    }

    try {
      this.connectionStatus.set('reconnecting');
      const room = await this.client.reconnect<NightshiftRoomState>(token);
      this.attachRoom(room);
      return true;
    } catch {
      sessionStorage.removeItem(reconnectionStorageKey);
      this.connectionStatus.set('idle');
      return false;
    }
  }

  send(message: ClientMessage): void {
    if (!this.room) {
      this.lastError.set('Join a room first.');
      return;
    }

    this.room.send('clientMessage', message);
    this.lastError.set(null);
  }

  setReady(ready: boolean): void {
    this.send({ type: 'SET_READY', ready });
  }

  selectGame(gameId: string): void {
    this.send({ type: 'SELECT_GAME', gameId });
  }

  voteNextGame(gameId: string): void {
    this.send({ type: 'VOTE_NEXT_GAME', gameId });
  }

  startGame(useDefaults = false): void {
    this.send({ type: 'START_GAME', useDefaults });
  }

  returnToLobby(): void {
    this.send({ type: 'RETURN_TO_LOBBY' });
  }

  submitGameAction(action: PlayerAction): void {
    this.send({ type: 'GAME_ACTION', action });
  }

  clearError(): void {
    this.lastError.set(null);
  }

  setLocalError(message: string): void {
    this.lastError.set(message);
    this.feedback.show({cue:'error',text:message});
  }

  private attachRoom(room: Room<NightshiftRoomState>): void {
    this.roomView.set(null);
    this.room = room;
    this.playerId.set(room.sessionId);
    this.connectionStatus.set('connected');
    this.persistReconnectionToken(room);
    this.updateRoomView(room.state);

    room.onStateChange((state) => this.updateRoomView(state));
    room.onMessage('serverMessage', (message: ServerMessage) => this.handleServerMessage(message));
    room.onLeave(() => {
      this.connectionStatus.set('disconnected');
      this.feedback.show({cue:'error',text:'Connection lost · Refresh to reconnect'});
    });
    room.onError((_code, message) => {
      this.lastError.set(message ?? 'The room connection hit an error.');
    });
  }

  private handleServerMessage(message: ServerMessage): void {
    if (message.type === 'ERROR') {
      this.lastError.set(message.message);
      this.feedback.show({cue:'error',text:message.message});
      return;
    }

    if (message.type === 'PRIVATE_VIEW') {
      this.privateView.set(message.view);
    }
  }

  private updateRoomView(state: NightshiftRoomState): void {
    const next = snapshotRoomState(state, gameCatalog);
    this.feedback.gameId = next.phase === 'LOBBY' ? next.selectedGameId : next.activeGame?.gameId ?? null;
    const deck=(next.activeGame?.publicView as {deck?:string}|undefined)?.deck;
    if(next.phase!=='LOBBY' && this.feedback.gameId==='estimate' && deck && deck!=='generated') this.feedback.gameId=`estimate-${deck}`;
    const event = roomFeedback(this.roomView(), next, this.playerId());
    this.roomView.set(next);
    this.stats.observe(next, this.playerId());
    if (event) this.feedback.show(event);
  }

  private persistReconnectionToken(room: Room<NightshiftRoomState>): void {
    if (room.reconnectionToken) {
      sessionStorage.setItem(reconnectionStorageKey, room.reconnectionToken);
    }
  }
}

function snapshotRoomState(state: NightshiftRoomState, games: readonly GameMetadata[]): RoomView {
  const players: Player[] = Array.from(state.players?.values?.() ?? []).map((player) => ({
    id: player.id,
    nickname: player.nickname,
    avatarId: player.avatarId,
    connected: player.connected,
    ready: player.ready,
    host: player.host,
    score: player.score,
    joinedAt: player.joinedAt,
    lastSeenAt: player.lastSeenAt
  }));

  return {
    code: state.code,
    phase: state.phase as RoomView['phase'],
    hostPlayerId: state.hostPlayerId,
    selectedGameId: state.selectedGameId,
    gameOptions: JSON.parse(state.gameOptionsJson || '{}'),
    estimateOptions: { daily: state.estimateDaily, deck: state.estimateDeck as import('@nightshift/protocol').EstimateDeck, difficulty: state.estimateDifficulty as 'easy' | 'standard' | 'hard' },
    players,
    games,
    activeGame: snapshotActiveGame(state),
    nextGameVotes: Object.fromEntries(state.nextGameVotes?.entries?.() ?? []),
    nextGameStartsAt: state.nextGameStartsAt ?? 0
  };
}

function snapshotActiveGame(state: NightshiftRoomState): ActiveGameView | null {
  if (!state.activeGame?.gameId) {
    return null;
  }

  return {
    gameId: state.activeGame.gameId,
    runId: state.activeGame.runId,
    mode: state.activeGame.mode,
    phase: state.activeGame.phase,
    round: state.activeGame.round,
    timerEndsAt: state.activeGame.timerEndsAt,
    publicView: parsePublicView(state.activeGame.publicViewJson),
    viewVersion: state.activeGame.viewVersion
  };
}

function parsePublicView(value: string): unknown {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}
