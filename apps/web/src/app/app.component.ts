import { Component, inject } from '@angular/core';
import { FeedbackService } from './services/feedback.service';
import { LucideAngularModule, Moon, Volume2, VolumeX } from 'lucide-angular';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ns-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  host: {'(document:click)': 'onInteraction($event)', '(document:change)': 'onChange($event)', '(document:pointerdown)': 'feedback.unlock()', '(document:keydown)': 'feedback.unlock()'},
  template: `
    <nav class="experience-bar" aria-label="Audio settings">
      <span class="nightshift-wordmark"><lucide-icon [img]="Moon" aria-hidden="true" /> NIGHTSHIFT <small>AFTER HOURS ARCADE</small></span>
      <div class="audio-controls">
      <button class="sound-toggle audio-test" type="button" (click)="feedback.testSound()">Test sound</button>
      <button class="sound-toggle" type="button" [attr.aria-pressed]="feedback.soundOn()" (click)="feedback.toggleSound()"
        [attr.aria-label]="feedback.soundOn() ? 'Mute game sounds' : 'Enable game sounds'">
        <lucide-icon [img]="feedback.soundOn() ? Volume2 : VolumeX" aria-hidden="true" />
        <span>Sound {{ feedback.soundOn() ? 'on' : 'off' }}</span>
      </button>
      </div>
    </nav>
    @if (feedback.audioStatus()) { <p class="audio-status" role="status">{{ feedback.audioStatus() }}</p> }
    <router-outlet />
    <div class="feedback-region" role="status" aria-live="polite" aria-atomic="true">
      @if (feedback.notice(); as event) {
        @for (item of [event]; track item.id) {
          <div class="feedback-toast" [class.feedback-error]="item.cue === 'error' || item.cue === 'incorrect'" [class.feedback-score]="item.cue === 'score' || item.cue === 'finish' || item.cue === 'correct' || item.cue === 'close'">
            <span class="feedback-symbol" aria-hidden="true">{{ item.cue === 'incorrect' ? '↻' : item.cue === 'error' ? '!' : item.cue === 'score' || item.cue === 'finish' || item.cue === 'correct' || item.cue === 'close' ? '✦' : '✓' }}</span>
            {{ item.text }}
          </div>
        }
      }
    </div>
  `
})
export class AppComponent {
  readonly feedback = inject(FeedbackService);
  readonly Moon = Moon; readonly Volume2 = Volume2; readonly VolumeX = VolumeX;
  onChange(event: Event): void {
    if (event.target instanceof HTMLSelectElement && !event.target.matches(':disabled')) this.feedback.play('tap');
  }
  onInteraction(event: Event): void {
    this.feedback.unlock();
    const target = event.target instanceof Element ? event.target.closest('button, summary') : null;
    if (target && !target.matches(':disabled') && !target.classList.contains('sound-toggle')) this.feedback.play('tap');
  }
}
