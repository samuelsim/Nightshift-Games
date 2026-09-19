import { Component, input } from '@angular/core';
import type { Player } from '@nightshift/protocol';
import { getAvatar } from '../models/avatar';
import { AvatarArtComponent } from './avatar-art.component';

@Component({
  selector: 'ns-player-list',
  standalone: true,
  imports: [AvatarArtComponent],
  template: `
    <div class="players">
      @for (player of players(); track player.id) {
        @let avatar = avatarFor(player.avatarId);
        <div class="player-row" [class.offline]="!player.connected">
          <div class="avatar" [style.--avatar-color]="avatar.color" role="img" [attr.aria-label]="avatar.label + ' avatar'" [title]="avatar.label"><ns-avatar-art [avatar]="avatar.id" /></div>
          <div class="player-copy">
            <div class="name-line">
              <strong>{{ player.nickname }}</strong>
              @if (player.host) {
                <span>Host</span>
              }
            </div>
            <small>{{ player.connected ? (player.ready ? 'Ready' : 'Not ready') : 'Disconnected' }}</small>
          </div>
          <b>{{ player.score }}</b>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .players {
        display: grid;
        gap: 0.65rem;
      }

      .player-row {
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.5rem;
        min-height: 62px;
        padding: 0.6rem;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.035);
      }

      .player-row.offline {
        opacity: 0.55;
      }

      .avatar {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 8px;
        background: color-mix(in srgb, var(--avatar-color) 28%, #202020);
        color: var(--text);
        font-size: 0.78rem;
        font-weight: 900;
      }

      .player-copy {
        min-width: 0;
      }

      .name-line {
        flex-wrap: wrap;
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      strong {
        overflow-wrap: anywhere;
      }

      span {
        padding: 0.15rem 0.38rem;
        border-radius: 999px;
        background: var(--gold);
        color: #141414;
        font-size: 0.7rem;
        font-weight: 900;
      }

      small {
        color: var(--muted);
      }

      b {
        color: var(--mint);
        font-size: 1.1rem;
      }
    `
  ]
})
export class PlayerListComponent {
  readonly players = input.required<readonly Player[]>();
  readonly avatarFor = getAvatar;
}
