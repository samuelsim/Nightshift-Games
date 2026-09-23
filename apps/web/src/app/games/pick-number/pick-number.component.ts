import { Component, computed, input, output } from '@angular/core';
import { useClock } from '../../shared/clock';
import type { PlayerAction, PlayerId, RoomView } from '@nightshift/protocol';
import type { PickNumberPlayerView, PickNumberPublicView } from '@nightshift/games-pick-number';
import { RotateCcw, Send, Trophy, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ns-pick-number',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    @let view = publicView();
    @let playerView = ownView();

    <article class="game">
      <header>
        <div>
          <span>Round {{ view?.round ?? 1 }} / {{ view?.maxRounds ?? 3 }}</span>
          <h1>Pick a Number</h1>
        </div>
        @if (room().phase === 'SCOREBOARD' && isHost()) {
          <button type="button" (click)="returnToLobby.emit()">
            <lucide-icon [img]="RotateCcw" aria-hidden="true" />
            <span>Lobby</span>
          </button>
        }
      </header>

      @if (view?.phase === 'SUBMISSION') {
        <section class="prompt">
          <h2>{{ view.solo ? 'Solo · Hunt the hidden number' : 'Choose from 1 to 10' }}</h2>
          @if (view.solo) {
            <p>Find 1–10 in three guesses. Score 100, 60 or 30 points. Beat the clock!</p>
            @if (view.solo.playerId !== playerId()) { <p>You join next round. Watch the hunt!</p> }
            <div class="hunt-lives" aria-label="Remaining guesses">@for (life of [0,1,2]; track life) { <span [class.spent]="life < view.solo.attempts.length" aria-hidden="true">◆</span> }<small>{{ 3-view.solo.attempts.length }} chances to crack it</small></div>
            <div class="hunt-trail" aria-live="polite">@for (attempt of view.solo.attempts; track attempt.value) { <span class="hint-ticket"><b>{{ attempt.value }}</b><i aria-hidden="true">{{ attempt.hint === 'Go higher' ? '↑' : '↓' }}</i>{{ attempt.hint }}</span> }</div>
            <div class="hunt-radar" aria-live="polite"><span aria-hidden="true">◎</span><strong>{{ huntRange() }}</strong><small>Follow the arrows. Narrow the search.</small></div>
          } @else { <p>Closest to the secret random number earns 5 points. An exact hit earns 8. Ties share the win.</p> }
          <div class="number-grid">
            @for (value of values; track value) {
              <button
                type="button"
                [class.selected]="playerView?.submittedValue === value"
                [class.ruled-out]="view.solo && ruledOut(value)"
                [attr.aria-label]="view.solo && ruledOut(value) ? value + ', ruled out by your hints' : 'Pick ' + value"
                [disabled]="expired() || (view.solo ? view.solo.playerId !== playerId() || tried(value) : playerView?.submitted)"
                (click)="pick(value)"
              >
                {{ value }}
              </button>
            }
          </div>
          <p>{{ view.solo ? (3 - view.solo.attempts.length) + ' guesses left' : submittedLabel(view.submittedPlayerIds) }}</p>
        </section>
      }

      @if (view?.phase === 'REVEAL') {
        <section class="reveal">
          <span>The number was</span>
          <strong>{{ view.target }}</strong>
          <div class="guesses">
            @for (submission of view.latestResult?.submissions ?? []; track submission.playerId) {
              <div [class.winner]="isWinner(view, submission.playerId)">
                <span>{{ playerName(submission.playerId) }}</span>
                <b>{{ submission.value }}</b>
              </div>
            }
          </div>
          @if (isHost()) {
            <button type="button" class="primary" (click)="nextRound()">
              <lucide-icon [img]="Send" aria-hidden="true" />
              <span>{{ view.round >= view.maxRounds ? 'Final Scores' : 'Next Round' }}</span>
            </button>
          }
        </section>
      }

      @if (view?.phase === 'RESULTS') {
        <section class="scores">
          <div class="score-title">
            <lucide-icon [img]="Trophy" aria-hidden="true" />
            <h2>Scoreboard</h2>
          </div>
          @for (player of sortedPlayers(); track player.id) {
            <div>
              <span>{{ player.nickname }}</span>
              <b>{{ player.score }}</b>
            </div>
          }
          @if (isHost()) {
            <button type="button" class="primary" (click)="returnToLobby.emit()">
              <lucide-icon [img]="RotateCcw" aria-hidden="true" />
              <span>Back to Lobby</span>
            </button>
          }
        </section>
      }
    </article>
  `,
  styles: [
    `
      .hunt-radar {display:grid;grid-template-columns:32px 1fr;gap:.2rem .6rem;align-items:center;padding:.65rem .8rem;margin:.6rem 0;border:1px solid var(--gold);border-radius:10px;background:#ffd66b0a}
      .hunt-radar>span {grid-row:1/3;color:var(--gold);font-size:2rem;animation:radar-pulse 1.2s ease-in-out}
      .hunt-radar strong {font-size:.9rem;color:var(--gold)}.hunt-radar small{font-size:.75rem;color:var(--muted)}
      .hunt-trail:empty{display:none}
      .number-grid button.ruled-out {opacity:.4;text-decoration:line-through;filter:grayscale(1);transform:scale(.94);transition:opacity .25s,transform .25s}
      @keyframes radar-pulse {50%{opacity:.45;transform:scale(.9)}}
      @media(prefers-reduced-motion:reduce){.hunt-radar>span{animation:none}.number-grid button.ruled-out{transition:none}}
      .game {
        width: min(100%, 760px);
        margin: auto;
        display: grid;
        gap: 1rem;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      h1,
      h2,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(2rem, 10vw, 4rem);
        line-height: 1;
        letter-spacing: 0;
      }

      h2 {
        font-size: 1.25rem;
        letter-spacing: 0;
      }

      header span,
      .prompt p,
      .reveal > span {
        color: var(--muted);
        font-weight: 800;
      }

      .prompt,
      .reveal,
      .scores {
        display: grid;
        gap: 1rem;
        align-content: start;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--surface);
      }

      .number-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.4rem;
      }

      button {
        display: inline-flex;
        min-height: 54px;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-strong);
        color: var(--text);
        padding: 0 1rem;
        cursor: pointer;
        font-weight: 900;
      }

      .number-grid button {
        min-height: 48px;
        padding: .5rem 0;
        color: #141414;
        background: var(--gold);
        border-color: var(--gold);
        font-size: 1.5rem;
      }

      button.selected,
      button.primary {
        background: var(--mint);
        color: #141414;
        border-color: var(--mint);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .reveal strong {
        color: var(--rose);
        font-size: clamp(4.5rem, 35vw, 10rem);
        line-height: 0.85;
      }

      .guesses,
      .scores {
        width: min(100%, 720px);
      }

      .guesses,
      .scores {
        display: grid;
        gap: 0.65rem;
      }

      .guesses div,
      .scores div:not(.score-title) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 58px;
        padding: 0.75rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }

      .guesses div.winner {
        border-color: var(--mint);
      }

      .score-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      b {
        color: var(--mint);
        font-size: 1.2rem;
      }

      lucide-icon {
        display: inline-grid;
        width: 21px;
        height: 21px;
      }
      @media(max-width:480px){.prompt,.reveal,.scores{padding:.75rem;gap:.65rem}.hunt-radar{margin:0}.hunt-trail:empty{display:none}}
    `
  ]
})
export class PickNumberComponent {
  ruledOut(value:number):boolean {
    return this.publicView()?.solo?.attempts.some(attempt=>attempt.hint==='Go higher' ? value<=attempt.value : attempt.hint==='Go lower' ? value>=attempt.value : false) ?? false;
  }
  huntRange():string {
    const remaining=this.values.filter(value=>!this.ruledOut(value));
    return remaining.length===1 ? `Target isolated: ${remaining[0]}` : `Search zone: ${remaining[0]}–${remaining.at(-1)}`;
  }
  private readonly now = useClock();
  readonly expired = computed(() => !!this.publicView()?.timerEndsAt && this.now() >= this.publicView()!.timerEndsAt!);
  tried(value:number):boolean { return this.publicView()?.solo?.attempts.some(a=>a.value===value) ?? false; }
  readonly room = input.required<RoomView>();
  readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>();
  readonly isHost = input.required<boolean>();
  readonly action = output<PlayerAction>();
  readonly returnToLobby = output<void>();
  readonly RotateCcw = RotateCcw;
  readonly Send = Send;
  readonly Trophy = Trophy;
  readonly values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  publicView(): PickNumberPublicView | null {
    const value = this.room().activeGame?.publicView;
    return isPickNumberPublicView(value) ? value : null;
  }

  ownView(): PickNumberPlayerView | null {
    const value = this.privateView();
    return isPickNumberPlayerView(value) ? value : null;
  }

  pick(value: number): void {
    if (this.expired() || this.publicView()?.phase !== 'SUBMISSION') return;
    this.action.emit({ type: 'PICK_NUMBER_SUBMIT', round: this.publicView()!.round, value });
  }

  nextRound(): void {
    this.action.emit({ type: 'PICK_NUMBER_NEXT_ROUND', round: this.publicView()!.round });
  }

  playerName(playerId: PlayerId): string {
    return this.room().players.find((player) => player.id === playerId)?.nickname ?? 'Someone';
  }

  isWinner(view: PickNumberPublicView, playerId: PlayerId): boolean {
    return view.latestResult?.winners.includes(playerId) ?? false;
  }

  submittedLabel(playerIds: readonly PlayerId[]): string {
    const playerCount = this.room().players.filter((player) => player.connected).length;
    return `${playerIds.length} of ${playerCount} locked in`;
  }

  sortedPlayers() {
    return [...this.room().players].sort((left, right) => right.score - left.score);
  }
}

function isPickNumberPublicView(value: unknown): value is PickNumberPublicView {
  return !!value && typeof value === 'object' && 'phase' in value && 'submittedPlayerIds' in value;
}

function isPickNumberPlayerView(value: unknown): value is PickNumberPlayerView {
  return !!value && typeof value === 'object' && 'submitted' in value;
}
