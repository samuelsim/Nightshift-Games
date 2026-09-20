import { GameSettingsComponent } from '../shared/game-settings.component';
import { defaultGameOptions, effectiveGameOptions, type GameOptions } from '@nightshift/protocol/room';
import { InfiltratorComponent } from '../games/human-exe/infiltrator.component';
import { HostStatusComponent } from '../shared/host-status.component';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import QRCode from 'qrcode';
import { FeedbackService } from '../services/feedback.service';
import { GameClientService } from '../services/game-client.service';
import { AvatarPickerComponent } from '../shared/avatar-picker.component';
import { PlayerListComponent } from '../shared/player-list.component';
import { PickNumberComponent } from '../games/pick-number/pick-number.component';
import { EstimateComponent } from '../games/estimate/estimate.component';
import { RestrictedCluesComponent } from '../games/restricted-clues/restricted-clues.component';
import { HumanExeComponent } from '../games/human-exe/human-exe.component';
import { MajorityRulesComponent } from '../games/majority-rules/majority-rules.component';
import { OneOfUsComponent } from '../games/one-of-us/one-of-us.component';
import { NextGameComponent } from '../shared/next-game.component';
import { RoundStatusComponent } from '../shared/round-status.component';
import { GameArtComponent } from '../shared/game-art.component';
import { GameStageComponent } from '../shared/game-stage.component';
import { GameHelpComponent } from '../shared/game-help.component';
import { RoundOutcomeComponent } from '../shared/round-outcome.component';
import { avatarOptions } from '../models/avatar';
import { Check, Copy, LogIn, Play, RotateCcw, Users, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ns-room-page',
  standalone: true,
  imports: [GameSettingsComponent,InfiltratorComponent, HostStatusComponent, FormsModule, AvatarPickerComponent, PlayerListComponent, PickNumberComponent, EstimateComponent, RestrictedCluesComponent, HumanExeComponent, MajorityRulesComponent, OneOfUsComponent, NextGameComponent, RoundStatusComponent, LucideAngularModule, GameArtComponent, GameHelpComponent, RoundOutcomeComponent, GameStageComponent],
  template: `
    <main class="room-shell">
      @if (!room()) {
        <section class="join-card">
          <h1>Join {{ routeCode() }}</h1>
          <label>
            Nickname
            <input [(ngModel)]="nickname" maxlength="24" autocomplete="nickname" placeholder="Alice" />
          </label>
          <ns-avatar-picker [selectedAvatarId]="avatarId()" (selected)="avatarId.set($event)" />
          <button type="button" class="primary" [disabled]="busy()" (click)="join()">
            <lucide-icon [img]="LogIn" aria-hidden="true" />
            <span>Join Room</span>
          </button>
        </section>
      } @else {
        @defer (on immediate) { <ns-game-help [gameId]="room()?.activeGame?.gameId || room()?.selectedGameId || 'pick-number'" [solo]="soloMode()" /> }
        <ns-host-status [room]="room()!" />
        <header class="room-header">
          <div>
            <span class="eyebrow">Room</span>
            <h1>{{ room()?.code }}</h1>
          </div>
          <button type="button" title="Copy join link" (click)="copyJoinLink()">
            <lucide-icon [img]="Copy" aria-hidden="true" />
            <span class="visually-hidden">Copy join link</span>
          </button>
        </header>

        @if (client.lastError()) {
          <p class="error" role="alert">{{ client.lastError() }}</p>
        }

        @if (room()?.phase === 'LOBBY') {
          <section class="lobby-layout">
            <section class="panel">
              <div class="panel-title">
                <lucide-icon [img]="Users" aria-hidden="true" />
                <h2>Players</h2>
              </div>
              <ns-player-list [players]="room()?.players ?? []" />
              <details class="invite-details"><summary>Invite friends · QR code</summary><div class="qr-panel">@if (qrDataUrl()) { <img [src]="qrDataUrl()" alt="Scan to join this room" /> }<p>{{ joinLink() }}</p><button type="button" (click)="copyJoinLink()">Copy join link</button></div></details>
              @if (!client.isHost()) { <button type="button" class="ready" [class.on]="me()?.ready" (click)="toggleReady()">
                <lucide-icon [img]="Check" aria-hidden="true" />
                <span>{{ me()?.ready ? 'Ready' : 'Ready Up' }}</span>
              </button> }
            </section>

            <section class="panel game-library">
              <h2>Choose a game</h2>
              @if (!client.isHost()) {
                <p>{{ hostName() }} is choosing the game.</p>
              }
              <div class="game-list">
                @for (game of room()?.games ?? []; track game.id) {
                  <button
                    type="button"
                    class="game-card"
                    [attr.data-game]="game.id"
                    [class.selected]="room()?.selectedGameId === game.id"
                    [attr.aria-pressed]="room()?.selectedGameId === game.id"
                    [disabled]="!client.isHost()"
                    (click)="client.selectGame(game.id)"
                  >
                    <ns-game-art [game]="game.id" />
                    <strong>{{ game.name }}</strong>
                    @if (room()?.selectedGameId === game.id) {
                      <span class="selection-label">✓ Selected</span>
                    }
                    <small>{{ game.minPlayers }}-{{ game.maxPlayers }} players &middot; {{ game.estimatedMinutes }} min</small>
                  </button>
                }
              </div>

              <p class="selected-description">{{ selectedGameTagline() }}</p>
              <ns-game-settings [gameId]="room()?.selectedGameId || 'pick-number'" [options]="selectedOptions()" [isHost]="client.isHost()" (optionsChange)="changeOptions($event)" />
              @if (client.isHost()) {
                <button type="button" class="primary start" (click)="client.startGame()">
                  <lucide-icon [img]="Play" aria-hidden="true" />
                  <span>{{ hasCustomOptions() ? 'Start ' : 'Quick start · ' }}{{ selectedGameName() }}</span>
                </button>
                @if (hasCustomOptions()) { <button type="button" (click)="startDefaults()">{{ hasGuests() ? 'Use defaults' : 'Quick start · defaults' }}</button> }
              }
            </section>
          </section>
        } @else {
          <section class="game-layout" [attr.data-game]="room()?.activeGame?.gameId" [attr.data-phase]="room()?.activeGame?.phase">
            @defer (on immediate) { <ns-game-stage [room]="room()!" /> }
            <ns-round-status [room]="room()!" />
            @defer (on immediate) { <ns-round-outcome [room]="room()!" [playerId]="client.playerId()" /> }
            @if (room()?.activeGame?.gameId === 'majority-rules') {
              @defer (on immediate) {
              <ns-majority-rules [room]="room()!" [playerId]="client.playerId()" [privateView]="client.privateView()"
                [isHost]="client.isHost()" (action)="client.submitGameAction($event)" />
              } @placeholder { <p>Loading Majority Rules…</p> }
            }
            @if (room()?.activeGame?.gameId === 'one-of-us') {
              @defer (on immediate) {
              <ns-one-of-us [room]="room()!" [playerId]="client.playerId()" [privateView]="client.privateView()"
                [isHost]="client.isHost()" (action)="client.submitGameAction($event)" />
              } @placeholder { <p>Loading One of Us Is Lying…</p> }
            }
            @if (room()?.activeGame?.gameId === 'restricted-clues') {
              @defer (on immediate) {
              <ns-restricted-clues [room]="room()!" [playerId]="client.playerId()" [privateView]="client.privateView()"
                [isHost]="client.isHost()" (action)="client.submitGameAction($event)" />
              } @placeholder { <p>Loading Restricted Clues…</p> }
            }
            @if (room()?.activeGame?.gameId === 'human-exe') {
              @defer (on immediate) {
              <ns-human-exe [room]="room()!" [playerId]="client.playerId()" [privateView]="client.privateView()"
                [isHost]="client.isHost()" (action)="client.submitGameAction($event)" />
              } @placeholder { <p>Loading Human.exe…</p> }
            }
            @if (room()?.activeGame?.gameId === 'human-infiltrator') {
              @defer (on immediate) {
                <ns-infiltrator [room]="room()!" [playerId]="client.playerId()" [privateView]="client.privateView()" [isHost]="client.isHost()" (action)="client.submitGameAction($event)" />
              } @placeholder { <p>Loading Infiltrator…</p> }
            }
            @if (room()?.activeGame?.gameId === 'estimate') {
              @defer (on immediate) {
              <ns-estimate
                [room]="room()!"
                [playerId]="client.playerId()"
                [privateView]="client.privateView()"
                [isHost]="client.isHost()"
                (action)="client.submitGameAction($event)"
                (returnToLobby)="client.returnToLobby()"
              />
              } @placeholder { <p>Loading Estimate…</p> }
            }
            @if (room()?.activeGame?.gameId === 'pick-number') {
              @defer (on immediate) {
              <ns-pick-number
                [room]="room()!"
                [playerId]="client.playerId()"
                [privateView]="client.privateView()"
                [isHost]="client.isHost()"
                (action)="client.submitGameAction($event)"
                (returnToLobby)="client.returnToLobby()"
              />
              } @placeholder { <p>Loading Pick a Number…</p> }
            }
            <ns-next-game [room]="room()!" [playerId]="client.playerId()" [isHost]="client.isHost()"
              (vote)="client.voteNextGame($event)" (returnToLobby)="client.returnToLobby()" />
          </section>
        }
      }
    </main>
  `,
  styles: [
    `
      .room-shell {
        width: min(100%, 1180px);
        min-height: calc(100dvh - 64px);
        margin: 0 auto;
        padding: 1rem;
      }

      .join-card,
      .panel,
      .qr-panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }

      .join-card {
        display: grid;
        width: min(100%, 480px);
        gap: 0.9rem;
        margin: 12dvh auto;
        padding: 1rem;
      }

      .room-header {
        padding-top: 0; padding-right: 9rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .eyebrow {
        color: var(--gold);
        font-weight: 900;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(1.4rem, 5vw, 2rem);
        line-height: 0.95;
        letter-spacing: 0;
      }

      h2 {
        font-size: 1.05rem;
        letter-spacing: 0;
      }

      .lobby-layout {
        display: grid;
        gap: 1rem;
      }

      .panel,
      .qr-panel {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
      }

      .panel-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .qr-panel {
        justify-items: center;
        align-content: center;
      }

      .qr-panel img {
        width: min(220px, 70vw);
        aspect-ratio: 1;
        border-radius: 8px;
        background: white;
      }

      .qr-panel p {
        max-width: 100%;
        color: var(--muted);
        overflow-wrap: anywhere;
        text-align: center;
      }

      label {
        display: grid;
        gap: 0.4rem;
        color: var(--muted);
        font-weight: 800;
      }

      input {
        min-height: 54px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #141414;
        color: var(--text);
        padding: 0 0.85rem;
      }

      button {
        display: inline-flex;
        min-height: 50px;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-strong);
        color: var(--text);
        padding: 0 0.9rem;
        cursor: pointer;
        font-weight: 900;
      }

      button.primary {
        background: var(--rose);
        color: #141414;
        border-color: var(--rose);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .ready.on {
        background: var(--mint);
        color: #141414;
        border-color: var(--mint);
      }

      .game-list {
        display: grid;
        gap: 0.65rem;
      }

      .game-card {
        display: grid;
        justify-items: start;
        min-height: auto;
        padding: 0.85rem;
        text-align: left;
      }

      .game-card.selected {
        border-color: var(--gold);
        background: color-mix(in srgb, var(--gold) 12%, var(--surface-strong));
        box-shadow: inset 0 0 0 1px var(--gold);
      }

      .game-card .selection-label {
        color: var(--gold);
        font-weight: 900;
      }

      .game-card span,
      .game-card small {
        color: var(--muted);
      }

      .start {
        width: 100%;
      }

      .error {
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border: 1px solid color-mix(in srgb, var(--danger) 65%, var(--line));
        border-radius: 8px;
        color: var(--danger);
        background: color-mix(in srgb, var(--danger) 12%, transparent);
        font-weight: 800;
      }

      lucide-icon {
        display: inline-grid;
        width: 21px;
        height: 21px;
      }

      @media (min-width: 840px) {
        .room-shell {
          padding: 2rem;
        }

        .lobby-layout {
          grid-template-columns: minmax(240px, 260px) minmax(0, 1fr);
          align-items: start;
        }
      }
    `
  ]
})
export class RoomPageComponent implements OnInit {
  protected readonly selectedOptions = computed(()=>effectiveGameOptions(this.room()?.selectedGameId ?? 'pick-number',this.room()?.gameOptions?.[this.room()?.selectedGameId ?? 'pick-number']));
  protected readonly hasCustomOptions = computed(()=>JSON.stringify(this.selectedOptions())!==JSON.stringify(defaultGameOptions(this.room()?.selectedGameId ?? 'pick-number')));
  protected readonly hasGuests = computed(()=>this.room()?.players.some(player=>player.connected && player.id!==this.room()?.hostPlayerId) ?? false);
  protected changeOptions(options: GameOptions): void {
    this.client.send({type:'SET_GAME_OPTIONS',gameId:this.room()?.selectedGameId ?? 'pick-number',options});
  }
  protected startDefaults(): void {
    if (this.hasGuests()) this.changeOptions(defaultGameOptions(this.room()?.selectedGameId ?? 'pick-number'));
    else this.client.startGame(true);
  }
  protected readonly soloMode = computed(()=>{
    const room=this.room();
    if(room?.phase==='LOBBY') return room.players.filter(p=>p.connected).length===1;
    const view=room?.activeGame?.publicView as {solo?:unknown;soloPlayerId?:string}|null;
    return !!(view?.solo || view?.soloPlayerId);
  });
  protected readonly client = inject(GameClientService);
  private readonly feedback = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);
  protected readonly room = this.client.roomView;
  private readonly pageStage = computed(() => `${this.room()?.phase}:${this.room()?.activeGame?.gameId}:${this.room()?.activeGame?.round}:${this.room()?.activeGame?.phase}`);

  constructor() {
    effect(() => {
      this.pageStage();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  }
  protected readonly selectedGameTagline = computed(() => this.room()?.games.find(game => game.id === this.room()?.selectedGameId)?.tagline ?? '');
  protected readonly selectedGameName = computed(() =>
    this.room()?.games.find((game) => game.id === this.room()?.selectedGameId)?.name ?? 'game');
  protected readonly hostName = computed(() =>
    this.room()?.players.find((player) => player.id === this.room()?.hostPlayerId)?.nickname ?? 'the host');
  protected readonly Check = Check;
  protected readonly Copy = Copy;
  protected readonly LogIn = LogIn;
  protected readonly Play = Play;
  protected readonly RotateCcw = RotateCcw;
  protected readonly Users = Users;
  protected readonly routeCode = computed(() => this.route.snapshot.paramMap.get('code')?.toUpperCase() ?? '');
  protected readonly joinLink = computed(() => `${location.origin}/join/${this.room()?.code ?? this.routeCode()}`);
  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly avatarId = signal(avatarOptions[0]!.id);
  protected readonly busy = signal(false);
  protected nickname = '';

  protected readonly me = computed(() => {
    const playerId = this.client.playerId();
    return this.room()?.players.find((player) => player.id === playerId) ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.client.reconnectFromSession();
    await this.updateQr();
  }

  protected async join(): Promise<void> {
    this.busy.set(true);
    this.client.clearError();

    try {
      await this.client.joinRoom(this.routeCode(), {
        nickname: this.nickname.trim() || 'Night Owl',
        avatarId: this.avatarId()
      });
      await this.updateQr();
    } catch (error) {
      this.client.setLocalError(getErrorMessage(error, 'Could not join that room.'));
    } finally {
      this.busy.set(false);
    }
  }

  protected toggleReady(): void {
    this.client.setReady(!this.me()?.ready);
  }

  protected async copyJoinLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.joinLink());
      this.feedback.show({cue:'lock',text:'Join link copied'});
    } catch {
      this.feedback.show({cue:'error',text:'Could not copy. Use the link under Invite friends.'});
    }
  }

  private async updateQr(): Promise<void> {
    const link = this.joinLink();

    if (!link.endsWith('/join/')) {
      this.qrDataUrl.set(await QRCode.toDataURL(link, { margin: 1, width: 360 }));
    }
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
