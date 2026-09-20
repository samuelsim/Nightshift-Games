import { quickTips } from '../shared/game-guides';
import { gameCatalog } from '@nightshift/games-registry/catalog';
import { PersonalStatsComponent } from '../shared/personal-stats.component';
import { Component, inject, signal } from '@angular/core';
import { GameArtComponent } from '../shared/game-art.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameClientService } from '../services/game-client.service';
import { AvatarPickerComponent } from '../shared/avatar-picker.component';
import { Moon, LogIn, Plus, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'ns-home-page',
  standalone: true,
  imports: [PersonalStatsComponent, FormsModule, AvatarPickerComponent, LucideAngularModule, GameArtComponent],
  template: `
    <main class="home-shell">
      <section class="intro">
        <div class="brand-mark">
          <lucide-icon [img]="Moon" aria-hidden="true" />
        </div>
        <p class="kicker">Quick games. Solo or with friends.</p>
        <h1>Nightshift Games</h1>
        <p class="home-tagline">Small games. Big accusations.</p>
      </section>

      <section class="join-panel">
        <label>
          Nickname
          <input [(ngModel)]="nickname" maxlength="24" autocomplete="nickname" placeholder="Night Owl" />
        </label>

        <label>
          Room code
          <input [(ngModel)]="roomCode" maxlength="5" autocapitalize="characters" placeholder="K7F2Q" />
        </label>

        <ns-avatar-picker [selectedAvatarId]="avatarId()" (selected)="avatarId.set($event)" />

        @if (client.lastError()) {
          <p class="error" role="alert">{{ client.lastError() }}</p>
        }

        <div class="actions">
          <button type="button" class="primary" [disabled]="busy()" (click)="createRoom()">
            <lucide-icon [img]="Plus" aria-hidden="true" />
            <span>Create Room</span>
          </button>
          <button type="button" [disabled]="busy() || !roomCode.trim()" (click)="joinRoom()">
            <lucide-icon [img]="LogIn" aria-hidden="true" />
            <span>Join Room</span>
          </button>
        </div>
      </section>
      <section class="daily-invite" aria-label="Daily challenges">
        <svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="15" y="20" width="70" height="65" rx="12"/><path d="M15 39H85M32 13V28M68 13V28"/><path d="M50 47L55 57L67 59L58 67L60 79L50 73L40 79L42 67L33 59L45 57Z"/></svg>
        <div><span>ONE DAY. SAME FIVE QUESTIONS.</span><h2>Daily Estimate</h2>
          <p>Five questions. Pick a topic in the lobby. New sets at 00:00 UTC.</p>
          <button type="button" class="primary" [disabled]="busy()" (click)="createRoom(true)">Play daily Estimate</button>
        </div>
      </section>
      <details class="home-disclosure"><summary>Explore games · How to play</summary><section class="arcade-shelf" aria-label="Games in the arcade">
        
        @for (game of artGames; track game.id) {
          <details class="shelf-game" name="game-preview" [attr.data-game]="game.id">
            <summary><ns-game-art [game]="game.id" /><span class="preview-title">{{ game.name }}</span><span class="preview-meta">{{ game.minPlayers }}–{{ game.maxPlayers }} players · How to play</span></summary>
            <div class="preview-rules">
              <p>{{ tips[game.id] }}</p>
              @if (tips[game.id + '-solo']; as soloTip) { <p><strong>Solo:</strong> {{ soloTip }}</p> }
            </div>
          </details>
        }
      </section>
      </details>
      <details class="home-disclosure"><summary>Your records</summary>@defer (on idle) { <ns-personal-stats /> }</details>
    </main>
  `,
  styles: [
    `
      .arcade-shelf { grid-template-columns:repeat(3,minmax(0,1fr)); align-items:start; }
      .shelf-game { border:1px solid var(--line); border-radius:12px; background:var(--surface); overflow:hidden; }
      .shelf-game summary { display:grid; grid-template-columns:56px minmax(0,1fr); gap:.3rem .75rem; align-items:center; padding:.8rem; cursor:pointer; list-style:none; }
      .shelf-game summary::-webkit-details-marker { display:none; }
      .shelf-game summary:hover, .shelf-game[open] summary { background:var(--surface-strong); }
      .shelf-game[open] { border-color:var(--gold); }
      .shelf-game ns-game-art { grid-row:1/3; padding:0; border-radius:10px; }
      .preview-title { font-size:.95rem; font-weight:800; }
      .preview-meta { font-size:.75rem; color:var(--muted); }
      .preview-rules { padding:0 .85rem .85rem; }
      .preview-rules p { font-size:.85rem; line-height:1.5; margin:.6rem 0 0; }
      @media(max-width:760px) { .arcade-shelf { grid-template-columns:repeat(2,minmax(0,1fr)); } }
      @media(max-width:540px) { .arcade-shelf { grid-template-columns:minmax(0,1fr); } }
      .home-shell {
        display: grid;
        min-height: calc(100dvh - 64px);
        place-items: center;
        gap: 1rem;
        padding: 1rem;
      }
      .daily-invite {grid-column:1/-1;width:min(100%,1100px);display:flex;align-items:center;gap:1rem;padding:1rem;border:1px solid var(--gold);border-radius:18px;background:linear-gradient(120deg,#383023,var(--surface));}
      .daily-invite svg {width:60px;flex-shrink:0;color:var(--gold);transform:rotate(-6deg)}.daily-invite span{font-size:.65rem;font-weight:900;letter-spacing:.12em;color:var(--gold)}.daily-invite h2{margin:.5rem 0}.daily-invite p{color:var(--muted);line-height:1.6}.daily-invite button{padding:.8rem 1.2rem}@media(max-width:540px){.daily-invite{align-items:flex-start;gap:.7rem;padding:1rem}.daily-invite svg{width:48px}}

      .intro,
      .join-panel {
        width: min(100%, 560px);
      }

      .intro {
        display: grid;
        gap: 0.65rem;
        align-content: end;
      }

      .brand-mark {
        display: grid;
        width: 58px;
        height: 58px;
        place-items: center;
        border-radius: 8px;
        background: var(--mint);
        color: #141414;
      }

      lucide-icon {
        display: inline-grid;
        width: 22px;
        height: 22px;
      }

      .brand-mark lucide-icon {
        width: 32px;
        height: 32px;
      }

      .kicker {
        margin: 0;
        color: var(--gold);
        font-weight: 800;
      }

      h1 {
        margin: 0;
        color: var(--text);
        font-size: clamp(2rem, 8vw, 4rem);
        line-height: 0.95;
        letter-spacing: 0;
      }

      .join-panel {
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }

      label {
        display: grid;
        gap: 0.4rem;
        color: var(--muted);
        font-size: 0.9rem;
        font-weight: 800;
      }

      input {
        width: 100%;
        min-height: 54px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #141414;
        color: var(--text);
        padding: 0 0.85rem;
        font-size: 1.05rem;
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
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

      button.primary {
        background: var(--rose);
        color: #141414;
        border-color: var(--rose);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      @media (max-width:440px) {
        .actions button { padding:0 .5rem; font-size:.9rem; white-space:nowrap; }
        .actions lucide-icon { display:none; }
      }

      .error {
        margin: 0;
        color: var(--danger);
        font-weight: 800;
      }

      @media (min-width: 760px) {
        .home-shell {
          grid-template-columns: minmax(280px, 0.9fr) minmax(380px, 560px);
          padding: 2rem;
        }
      }
    `
  ]
})
export class HomePageComponent {
  protected readonly artGames = gameCatalog;
  protected readonly tips = quickTips;
  protected readonly client = inject(GameClientService);
  private readonly router = inject(Router);
  protected readonly Moon = Moon;
  protected readonly Plus = Plus;
  protected readonly LogIn = LogIn;
  protected readonly avatarId = signal('moon');
  protected readonly busy = signal(false);
  protected nickname = '';
  protected roomCode = '';

  protected async createRoom(daily = false): Promise<void> {
    await this.withBusy(async () => {
      const code = await this.client.createRoom(this.joinOptions());
      if (daily) {
        this.client.selectGame('estimate');
        this.client.send({type:'SET_ESTIMATE_OPTIONS',deck:'generated',difficulty:'standard',daily:true});
      }
      await this.router.navigate(['/room', code]);
    });
  }

  protected async joinRoom(): Promise<void> {
    await this.withBusy(async () => {
      const code = this.roomCode.trim().toUpperCase();
      await this.client.joinRoom(code, this.joinOptions());
      await this.router.navigate(['/room', code]);
    });
  }

  private joinOptions() {
    return {
      nickname: this.nickname.trim() || 'Night Owl',
      avatarId: this.avatarId()
    };
  }

  private async withBusy(task: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.client.clearError();

    try {
      await task();
    } catch (error) {
      this.client.setLocalError(getErrorMessage(error, 'Could not connect to the room.'));
    } finally {
      this.busy.set(false);
    }
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
