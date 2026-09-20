import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { MusicService } from './services/music.service';
import { GameClientService } from './services/game-client.service';
import { FeedbackService } from './services/feedback.service';
import { LucideAngularModule, Moon, Volume2, VolumeX } from 'lucide-angular';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'ns-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  host: {'(document:click)': 'onInteraction($event)', '(document:change)': 'onChange($event)', '(document:pointerdown)': 'unlockAudio()', '(document:keydown)': 'unlockAudio()', '(document:visibilitychange)':'music.visibilityChanged()'},
  template: `
    <nav class="experience-bar" aria-label="Audio settings">
      <span class="nightshift-wordmark"><lucide-icon [img]="Moon" aria-hidden="true" /> NIGHTSHIFT <small>AFTER HOURS ARCADE</small></span>
      <div class="audio-controls">
      <details class="audio-menu" #audioMenu (keydown.escape)="audioMenu.open=false">
      <summary class="sound-toggle">♫ Audio</summary>
      <div class="audio-panel">
      <p class="music-title">{{ music.title() }}</p>
      <button class="sound-toggle" type="button" [attr.aria-pressed]="music.enabled()" (click)="music.toggle()" [attr.aria-label]="music.enabled() ? 'Mute background music' : 'Enable background music'">♫ Music {{ music.enabled() ? 'on' : 'off' }}</button>
      <label class="music-volume">Music volume <input type="range" min="0" max="100" step="5" [value]="music.volume()*100" (input)="music.setVolume(+$any($event.target).value/100)" /></label>
      @if (music.enabled() && music.status()) { <small>{{ music.status() }}</small> }
      <button class="sound-toggle audio-test" type="button" (click)="feedback.testSound()">Test sound</button>
      <button class="sound-toggle" type="button" [attr.aria-pressed]="feedback.soundOn()" (click)="feedback.toggleSound()"
        [attr.aria-label]="feedback.soundOn() ? 'Mute game sounds' : 'Enable game sounds'">
        <lucide-icon [img]="feedback.soundOn() ? Volume2 : VolumeX" aria-hidden="true" />
        <span>Effects {{ feedback.soundOn() ? 'on' : 'off' }}</span>
      </button>
      </div></details>
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
  readonly music = inject(MusicService);
  private readonly client = inject(GameClientService);
  private readonly router = inject(Router);
  private readonly route = signal(this.router.url);
  readonly feedback = inject(FeedbackService);
  constructor() {
    const navigation=this.router.events.subscribe(event=>{if(event instanceof NavigationEnd)this.route.set(event.urlAfterRedirects);});
    inject(DestroyRef).onDestroy(()=>navigation.unsubscribe());
    effect(()=>{const room=this.client.roomView();this.music.setScene(this.route()?.startsWith('/room/') && room?.phase!=='LOBBY' ? room?.activeGame?.gameId ?? null : null);});
    this.feedback.onCue=cue=>{if(cue!=='tap' && cue!=='assign') this.music.duck();};
  }
  unlockAudio():void {this.feedback.unlock();this.music.unlock();}
  readonly Moon = Moon; readonly Volume2 = Volume2; readonly VolumeX = VolumeX;
  onChange(event: Event): void {
    if (event.target instanceof HTMLSelectElement && !event.target.matches(':disabled')) this.feedback.play('tap');
  }
  onInteraction(event: Event): void {
    this.unlockAudio();
    const target = event.target instanceof Element ? event.target.closest('button, summary') : null;
    if (target && !target.matches(':disabled') && !target.classList.contains('sound-toggle')) this.feedback.play('tap');
  }
}
