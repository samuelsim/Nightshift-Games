import { Client, CloseCode, Room } from '@colyseus/core';
import { customAlphabet } from 'nanoid';
import { randomUUID } from 'node:crypto';
import { gameCatalog, getGameDefinition } from '@nightshift/games-registry';
import {
  ActiveGameSchema,
  NightshiftRoomState,
  PlayerSchema,
  type ClientMessage,
  type PlayerAction,
  type Player,
  type PlayerId,
  type RoomPhase,
  type ServerMessage
} from '@nightshift/protocol';
import type { AnyGameDefinition, GameContext } from '@nightshift/game-core';
import { clientMessageSchema } from './client-message.schema';
import { canStartGame, chooseNextHost, hostAfterDisconnect } from './room-policy';
import { chooseNextGame, eligibleGames } from './next-game-policy';

const roomCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCodeLength = 5;
const reconnectSeconds = 120;

export class NightshiftRoom extends Room<{ state: NightshiftRoomState }> {
  override maxClients = 8;
  private activeGameDefinition: AnyGameDefinition | null = null;
  private activeGameState: unknown = null;
  private humanQuestionHistory: string[] = [];
  private estimateQuestionHistory: string[] = [];
  private lastEstimateRound = '';

  override onCreate(): void {
    const code = generateRoomCode();
    this.roomId = code;
    this.setState(new NightshiftRoomState());
    this.state.code = code;
    this.state.selectedGameId = 'pick-number';
    this.state.phase = 'LOBBY';
    this.autoDispose = true;
    this.setSimulationInterval(() => this.tickGame(), 250);

    this.onMessage('clientMessage', (client, message: unknown) => {
      this.handleClientMessage(client, message);
    });
  }

  override onJoin(client: Client, options: unknown): void {
    const joinOptions = parseJoinOptions(options);
    const now = Date.now();
    const existingPlayer = this.state.players.get(client.sessionId);

    if (existingPlayer) {
      existingPlayer.connected = true;
      if (existingPlayer.id === this.state.hostPlayerId) existingPlayer.ready = true;
      existingPlayer.lastSeenAt = now;
      this.sendPrivateView(client);
      return;
    }

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.nickname = joinOptions.nickname;
    player.avatarId = joinOptions.avatarId;
    player.connected = true;
    player.ready = false;
    player.score = 0;
    player.joinedAt = now;
    player.lastSeenAt = now;

    if (!this.state.hostPlayerId) {
      this.state.hostPlayerId = player.id;
      player.host = true;
      player.ready = true;
    }

    this.state.players.set(player.id, player);
    this.syncGameViews();
  }

  override async onLeave(client: Client, code?: number): Promise<void> {
    const player = this.state.players.get(client.sessionId);

    if (player) {
      player.connected = false;
      player.ready = false;
      player.lastSeenAt = Date.now();
    }

    if (code === CloseCode.CONSENTED || code === CloseCode.FAILED_TO_RECONNECT) {
      this.removePlayer(client.sessionId);
      return;
    }

    try {
      const reconnectedClient = await this.allowReconnection(client, reconnectSeconds);
      const reconnectedPlayer = this.state.players.get(reconnectedClient.sessionId);

      if (reconnectedPlayer) {
        reconnectedPlayer.connected = true;
        if (reconnectedPlayer.id === this.state.hostPlayerId) reconnectedPlayer.ready = true;
        reconnectedPlayer.lastSeenAt = Date.now();
        this.sendPrivateView(reconnectedClient);
      }
    } catch {
      this.removePlayer(client.sessionId);
    }
  }

  private handleClientMessage(client: Client, message: unknown): void {
    const parsed = clientMessageSchema.safeParse(message);

    if (!parsed.success) {
      this.sendError(client, 'invalid_message', 'That message was not shaped correctly.');
      return;
    }

    this.applyClientMessage(client, parsed.data as ClientMessage);
  }

  private applyClientMessage(client: Client, message: ClientMessage): void {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      this.sendError(client, 'unknown_player', 'You are not in this room.');
      return;
    }

    player.lastSeenAt = Date.now();

    switch (message.type) {
      case 'SET_ESTIMATE_OPTIONS':
        if (player.id !== this.state.hostPlayerId) {
          this.sendError(client, 'host_only', 'Only the host can change Estimate settings.');
          return;
        }
        if (this.state.phase !== 'LOBBY' || this.state.selectedGameId !== 'estimate') {
          this.sendError(client, 'not_in_lobby', 'Select Estimate in the lobby to change its settings.');
          return;
        }
        if (this.state.estimateDeck !== message.deck || this.state.estimateDifficulty !== message.difficulty || this.state.estimateDaily !== !!message.daily) {
          this.state.estimateDeck = message.deck;
          this.state.estimateDifficulty = message.difficulty;
          this.state.estimateDaily = !!message.daily;
          for (const participant of this.state.players.values()) participant.ready = participant.connected && participant.id === this.state.hostPlayerId;
        }
        return;
      case 'VOTE_NEXT_GAME':
        if (this.state.phase !== 'PLAYING' && this.state.phase !== 'SCOREBOARD') {
          this.sendError(client, 'not_playing', 'Vote for the next game after this game starts.');
          return;
        }
        if (!eligibleGames(gameCatalog, this.getPlayers()).some(g => g.id === message.gameId)) {
          this.sendError(client, 'ineligible_game', 'That game is not available for this player count.');
          return;
        }
        this.state.nextGameVotes.set(player.id, message.gameId);
        return;
      case 'SET_READY':
        if (this.state.phase !== 'LOBBY') {
          this.sendError(client, 'not_in_lobby', 'Readiness can only change in the lobby.');
          return;
        }
        player.ready = player.id === this.state.hostPlayerId || message.ready;
        return;
      case 'SELECT_GAME':
        this.selectGame(client, player.id, message.gameId);
        return;
      case 'START_GAME':
        this.startGame(client, player.id);
        return;
      case 'RETURN_TO_LOBBY':
        this.returnToLobby(client, player.id);
        return;
      case 'GAME_ACTION':
        this.handleGameAction(client, player.id, message.action);
        return;
      default:
        assertNever(message);
    }
  }

  private selectGame(client: Client, playerId: PlayerId, gameId: string): void {
    if (playerId !== this.state.hostPlayerId) {
      this.sendError(client, 'host_only', 'Only the host can choose games.');
      return;
    }

    if (this.state.phase !== 'LOBBY') {
      this.sendError(client, 'not_in_lobby', 'Choose the next game from the lobby.');
      return;
    }

    const game = getGameDefinition(gameId);

    if (!game) {
      this.sendError(client, 'unknown_game', 'That game is not available yet.');
      return;
    }

    this.state.selectedGameId = game.metadata.id;
  }

  private startGame(client: Client, playerId: PlayerId): void {
    if (this.state.phase !== 'LOBBY') {
      this.sendError(client, 'game_already_running', 'A game is already running.');
      return;
    }

    const game = getGameDefinition(this.state.selectedGameId);

    if (!game) {
      this.sendError(client, 'unknown_game', 'That game is not available yet.');
      return;
    }

    const decision = canStartGame({
      players: this.getPlayers(),
      hostPlayerId: this.state.hostPlayerId,
      requesterPlayerId: playerId,
      game: game.metadata
    });

    if (!decision.ok) {
      this.sendError(client, decision.code, decision.message);
      return;
    }

    if (!this.beginGame(game)) this.sendError(client, 'start_failed', 'Could not start this game. Choose another.');
  }

  private beginGame(game: AnyGameDefinition): boolean {
    const context = this.createGameContext();
    const started = game.start(game.createInitialState(context), context);
    if (!started.ok) return false;

    this.activeGameDefinition = game;
    this.activeGameState = started.state;
    this.state.activeGame = new ActiveGameSchema();
    this.state.activeGame.runId = randomUUID();
    this.state.selectedGameId = game.metadata.id;
    this.state.nextGameVotes.clear();
    this.state.nextGameStartsAt = 0;
    this.resetPlayerScores();
    this.state.phase = 'PLAYING';
    this.syncGameViews();
    return true;
  }

  private handleGameAction(client: Client, playerId: PlayerId, action: PlayerAction): void {
    if (!this.activeGameDefinition || !this.activeGameState) {
      this.sendError(client, 'no_active_game', 'There is no active game right now.');
      return;
    }

    const result = this.activeGameDefinition.handleAction(
      this.activeGameState,
      playerId,
      action,
      this.createGameContext()
    );

    if (!result.ok) {
      this.sendError(client, result.error.code, result.error.message);
      return;
    }

    this.activeGameState = result.state;
    this.copyScoresFromGameState(result.state);

    if (this.activeGameDefinition.isFinished(result.state)) {
      this.finishGame();
    }

    this.syncGameViews();
  }

  private tickGame(): void {
    const nextHost = hostAfterDisconnect(this.getPlayers(), this.state.hostPlayerId, Date.now());
    if (nextHost !== this.state.hostPlayerId) this.assignHost(nextHost);
    if (this.state.phase === 'SCOREBOARD') {
      if (!this.getPlayers().some(p => p.connected)) {
        this.state.nextGameStartsAt = 0;
        return;
      }
      if (!this.state.nextGameStartsAt) this.state.nextGameStartsAt = Date.now() + 15_000;
      if (Date.now() < this.state.nextGameStartsAt) return;
      const nextId = chooseNextGame(gameCatalog, this.getPlayers(), this.state.nextGameVotes,
        this.state.activeGame.gameId, Math.random);
      const next = nextId ? getGameDefinition(nextId) : null;
      if (!next || !this.beginGame(next)) this.clearToLobby();
      return;
    }
    const game = this.activeGameDefinition;
    if (this.state.phase !== 'PLAYING' || !game?.tick || !this.activeGameState) return;
    const result = game.tick(this.activeGameState, this.createGameContext());
    if (!result.ok || result.state === this.activeGameState) return;
    this.activeGameState = result.state;
    this.copyScoresFromGameState(result.state);
    if (game.isFinished(result.state)) this.finishGame();
    this.syncGameViews();
  }

  private returnToLobby(client: Client, playerId: PlayerId): void {
    if (playerId !== this.state.hostPlayerId) {
      this.sendError(client, 'host_only', 'Only the host can return to the lobby.');
      return;
    }

    this.clearToLobby();
  }

  private finishGame(): void {
    if (this.state.phase === 'SCOREBOARD') return;
    this.state.phase = 'SCOREBOARD';
    this.state.nextGameStartsAt = Date.now() + 15_000;
  }

  private clearToLobby(): void {
    this.state.nextGameVotes.clear();
    this.state.nextGameStartsAt = 0;
    this.activeGameDefinition = null;
    this.activeGameState = null;
    this.state.activeGame = new ActiveGameSchema();
    this.setRoomPhase('LOBBY');

    for (const player of this.state.players.values()) {
      player.ready = player.connected && player.id === this.state.hostPlayerId;
    }
  }

  private syncGameViews(): void {
    if (!this.activeGameDefinition || !this.activeGameState) {
      return;
    }

    const publicView = this.activeGameDefinition.getPublicView(this.activeGameState, this.createGameContext());
    const phase = getStringProperty(publicView, 'phase');
    if (this.activeGameDefinition.metadata.id === 'estimate' && !getStringProperty(publicView, 'dailyId')) {
      const token = `${this.state.activeGame.runId}:${getNumberProperty(publicView,'round')}`;
      const question = getStringProperty(toRecord(publicView)?.['prompt'], 'question');
      if (question && token !== this.lastEstimateRound) {
        this.estimateQuestionHistory = [...this.estimateQuestionHistory.filter(old=>old!==question),question].slice(-1000);
        this.lastEstimateRound = token;
      }
    }
    if (this.activeGameDefinition.metadata.id === 'human-exe') {
      const question = getStringProperty(publicView, 'question');
      if (question && !this.humanQuestionHistory.includes(question)) this.humanQuestionHistory = [...this.humanQuestionHistory,question].slice(-15);
    }
    const round = getNumberProperty(publicView, 'round');

    if (round !== this.state.activeGame.round) {
      const view = toRecord(publicView);
      const mode = ['pick-number', 'human-exe'].includes(this.activeGameDefinition.metadata.id)
        ? view?.['solo'] || view?.['soloPlayerId'] ? 'solo' : 'multiplayer'
        : this.getPlayers().filter(player => player.connected).length === 1 ? 'solo' : 'multiplayer';
      const previous = this.state.activeGame.mode.split(':').at(-1);
      const participation = previous && previous !== mode ? 'mixed' : mode;
      this.state.activeGame.mode = this.activeGameDefinition.metadata.id === 'estimate'
        ? `${getStringProperty(publicView, 'dailyId') ? `daily:${getStringProperty(publicView, 'dailyId')}:` : ''}estimate:${getStringProperty(publicView, 'deck')}:${getStringProperty(publicView, 'difficulty')}:${participation}`
        : participation;
    }

    this.state.activeGame.gameId = this.activeGameDefinition.metadata.id;
    this.state.activeGame.phase = phase;
    this.state.activeGame.round = round;
    this.state.activeGame.timerEndsAt = getNumberProperty(publicView, 'timerEndsAt');
    this.state.activeGame.publicViewJson = JSON.stringify(publicView);
    this.state.activeGame.viewVersion += 1;

    for (const client of this.clients) {
      this.sendPrivateView(client);
    }
  }

  private sendPrivateView(client: Client): void {
    if (!this.activeGameDefinition || !this.activeGameState) {
      return;
    }

    const message: ServerMessage = {
      type: 'PRIVATE_VIEW',
      gameId: this.activeGameDefinition.metadata.id,
      view: this.activeGameDefinition.getPlayerView(
        this.activeGameState,
        client.sessionId,
        this.createGameContext()
      )
    };

    client.send('serverMessage', message);
  }

  private sendError(client: Client, code: string, message: string): void {
    const serverMessage: ServerMessage = {
      type: 'ERROR',
      code,
      message
    };

    client.send('serverMessage', serverMessage);
  }

  private removePlayer(playerId: PlayerId): void {
    const wasHost = this.state.hostPlayerId === playerId;
    this.state.players.delete(playerId);
    this.state.nextGameVotes.delete(playerId);

    if (wasHost) {
      const nextHostId = chooseNextHost(this.getPlayers());
      this.assignHost(nextHostId ?? '');
    }

    this.syncGameViews();
  }

  private assignHost(id: string): void {
    this.state.hostPlayerId = id;
    for (const player of this.state.players.values()) {
      player.host = player.id === id;
      if (player.host && player.connected) player.ready = true;
    }
    if (id) this.broadcast('serverMessage', { type: 'HOST_CHANGED', playerId: id } satisfies ServerMessage);
  }

  private resetPlayerScores(): void {
    for (const player of this.state.players.values()) {
      player.score = 0;
    }
  }

  private copyScoresFromGameState(gameState: unknown): void {
    if (!hasScores(gameState)) {
      return;
    }

    for (const [playerId, score] of Object.entries(gameState.scores)) {
      const player = this.state.players.get(playerId);

      if (player) {
        player.score = score;
      }
    }
  }

  private createGameContext(): GameContext {
    return {
      players: new Map(this.getPlayers().map((player) => [player.id, player])),
      now: Date.now(),
      random: Math.random,
      previousHumanQuestions: this.humanQuestionHistory,
      previousEstimateQuestions: this.estimateQuestionHistory,
      estimateOptions: {
        daily: this.state.estimateDaily,
        deck: this.state.estimateDeck as import('@nightshift/protocol').EstimateDeck,
        difficulty: this.state.estimateDifficulty as 'easy' | 'standard' | 'hard'
      },
      hostPlayerId: this.state.hostPlayerId
    };
  }

  private getPlayers(): Player[] {
    return Array.from(this.state.players.values()).map((player) => ({
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
  }

  private setRoomPhase(phase: RoomPhase): void {
    this.state.phase = phase;
  }
}

function generateRoomCode(): string {
  const random = customAlphabet(roomCodeAlphabet, roomCodeLength);
  return random();
}

function parseJoinOptions(options: unknown): { nickname: string; avatarId: string } {
  if (!options || typeof options !== 'object') {
    return { nickname: 'Night Owl', avatarId: 'moon' };
  }

  const record = options as Record<string, unknown>;
  const nickname = typeof record['nickname'] === 'string'
    ? record['nickname'].trim().slice(0, 24)
    : '';
  const avatarId = typeof record['avatarId'] === 'string'
    ? record['avatarId'].trim().slice(0, 24)
    : '';

  return {
    nickname: nickname || 'Night Owl',
    avatarId: avatarId || 'moon'
  };
}

function getStringProperty(value: unknown, key: string): string {
  const record = toRecord(value);

  if (typeof record?.[key] === 'string') {
    return record[key];
  }

  return '';
}

function getNumberProperty(value: unknown, key: string): number {
  const record = toRecord(value);

  if (typeof record?.[key] === 'number') {
    return record[key];
  }

  return 0;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function hasScores(value: unknown): value is { scores: Record<string, number> } {
  return (
    !!value &&
    typeof value === 'object' &&
    'scores' in value &&
    !!value.scores &&
    typeof value.scores === 'object'
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled client message: ${JSON.stringify(value)}`);
}

export const availableGames = gameCatalog;
