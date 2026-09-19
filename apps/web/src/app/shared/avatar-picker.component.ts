import { Component, input, output } from '@angular/core';
import { avatarOptions } from '../models/avatar';
import { AvatarArtComponent } from './avatar-art.component';

@Component({
  selector: 'ns-avatar-picker',
  standalone: true,
  imports: [AvatarArtComponent],
  template: `
    <fieldset class="avatar-picker">
      <legend>Choose your avatar</legend>
      <div class="avatar-grid">
      @for (avatar of avatars; track avatar.id) {
        <button
          type="button"
          class="avatar-button"
          [class.selected]="avatar.id === selectedAvatarId()"
          [style.--avatar-color]="avatar.color"
          [attr.aria-label]="avatar.label"
          [attr.aria-pressed]="avatar.id === selectedAvatarId()"
          [title]="avatar.label"
          (click)="selected.emit(avatar.id)"
        >
          <ns-avatar-art [avatar]="avatar.id" />
          <span>{{ avatar.label }}</span>
        </button>
      }
    </div>
    </fieldset>
  `,
  styles: [
    `
      .avatar-picker { min-width: 0; margin: 0; padding: 0; border: 0; }
      legend { padding: 0; margin-bottom: .6rem; color: var(--muted); font-size: .9rem; font-weight: 800; }

      .avatar-grid {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.55rem;
      }

      .avatar-button {
        min-width: 0;
        min-height: 64px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px 2px;
        border: 2px solid transparent;
        border-radius: 8px;
        background: color-mix(in srgb, var(--avatar-color) 22%, #202020);
        color: var(--text);
        cursor: pointer;
      }

      .avatar-button span {
        font-size: .6rem;
        font-weight: 700;
        padding-bottom: 2px;
      }

      .avatar-button.selected {
        border-color: var(--avatar-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--avatar-color) 22%, transparent);
      }
    `
  ]
})
export class AvatarPickerComponent {
  readonly selectedAvatarId = input.required<string>();
  readonly selected = output<string>();
  readonly avatars = avatarOptions;
}
