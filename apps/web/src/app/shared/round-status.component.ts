import { Component, computed, effect, inject, input } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { useClock } from './clock';
import { FeedbackService } from '../services/feedback.service';
import { countdownCue, type CountdownSnapshot } from '../services/countdown-cue';

@Component({selector:'ns-round-status',standalone:true,template:`
  @if (room().activeGame; as game) {
    <div class="round-status" [class.urgent]="deadline() > 0 && seconds() <= 10" [class.completed]="room().phase === 'SCOREBOARD'">
      <div class="round-status-label"><span class="live-dot" aria-hidden="true"></span>{{ label() }}</div>
      <div class="round-steps" [attr.aria-label]="'Round ' + game.round + ' of ' + total()">
        @for (step of steps(); track step) { <span [class.done]="step < game.round" [class.current]="step === game.round" aria-hidden="true"></span> }
      </div>
      @if (deadline()) {
        <div class="countdown-clock"><span class="timer-caption">{{ seconds() <= 10 ? 'HURRY, HURRY!' : 'ON THE CLOCK' }}</span><strong class="timer-value" role="timer" aria-live="off" [attr.aria-label]="seconds() + ' seconds remaining'">{{ seconds() }}<small>s</small></strong></div>
      } @else { <small class="round-status-hint">{{ room().phase === 'SCOREBOARD' ? 'Final scores' : 'Take your time' }}</small> }
    </div>
  }
`})
export class RoundStatusComponent {
  readonly room = input.required<RoomView>();
  private readonly now = useClock(); private readonly feedback = inject(FeedbackService);
  readonly deadline = computed(() => this.room().phase === 'SCOREBOARD' ? this.room().nextGameStartsAt : this.room().activeGame?.timerEndsAt ?? 0);
  readonly seconds = computed(() => Math.max(0, Math.ceil((this.deadline() - this.now()) / 1000)));
  readonly total = computed(() => {
    const view = this.room().activeGame?.publicView;
    return view && typeof view === 'object' && 'maxRounds' in view && typeof view.maxRounds === 'number' ? Math.min(10, view.maxRounds) : 5;
  });
  readonly steps = computed(() => Array.from({length:this.total()},(_,i)=>i+1));
  readonly label = computed(() => {
    if (this.room().phase === 'SCOREBOARD') return 'UP NEXT';
    const phase = this.room().activeGame?.phase;
    return phase === 'REVEAL' ? 'THE REVEAL' : phase === 'VOTING' ? 'CAST YOUR VOTE' : phase === 'DISCUSSION' ? 'TALK IT OUT' : phase === 'CLUES' ? 'CLUE TIME' : 'MAKE YOUR MOVE';
  });
  constructor() {
    let previous: CountdownSnapshot | null = null;
    effect(() => {
      const next = { deadline: this.deadline(), seconds: this.seconds() };
      const cue = countdownCue(previous, next);
      previous = next;
      if (cue) this.feedback.play(cue);
    });
  }
}
