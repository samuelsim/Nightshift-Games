import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { CluesPublicView, CluesPlayerView } from '@nightshift/games-restricted-clues';
import { useClock } from '../../shared/clock';
import { gameStyles } from '../game-styles';

@Component({ selector: 'ns-restricted-clues', standalone: true, imports: [FormsModule], styles: [gameStyles],
  template: `
    @if (view(); as game) {
      <article>
        <header><p>Round {{ game.round }} / {{ game.maxRounds }}</p><h1>Restricted Clues</h1></header>
        @if (game.phase === 'CLUES') {
          <section>
            <h2>{{ name(game.giver) }} gives clues · {{ seconds() }}s left</h2>
            @if (isGiver()) {
              @if (ownView()?.round === game.round && ownView()?.word) {
                <p>Your secret word</p><strong class="secret">{{ ownView()?.word }}</strong>
                <p>Forbidden: {{ ownView()?.forbidden?.join(', ') }}. No answer fragments either.</p>
              } @else { <p>Loading your secret word…</p> }
              <p>Send up to six one-word clues. No rhymes, spelling hints, or gestures that give it away.</p>
            } @else { <p>Guess the secret word from the clues. A correct guess earns you and the clue giver 100 points.</p> }
            <div class="chips">@for (clue of game.clues; track clue) { <strong>{{ clue }}</strong> }</div>
            @if (isGiver()) {
              <div class="clue-budget" aria-live="polite">
                <span aria-hidden="true">@for (slot of [0,1,2,3,4,5]; track slot) { <i [class.used]="slot < game.clues.length"></i> }</span>
                <b>{{ 6 - game.clues.length }} clues left</b>
                @if (game.clues.length >= 6) { <small>All clues sent. Let the room solve it!</small> }
              </div>
            } @else if (!game.clues.length) { <p class="waiting-note">Waiting for the first clue…</p> }
            <form (ngSubmit)="send()">
              <label for="clues-text">{{ isGiver() ? 'Your one-word clue' : 'Your guess' }}</label>
              <input id="clues-text" name="clueText" [ngModel]="text()" (ngModelChange)="text.set($event)"
                maxlength="24" autocomplete="off" autocapitalize="none" [disabled]="unavailable()" />
              <button class="primary" [disabled]="unavailable() || !text().trim()" type="submit">{{ seconds() === 0 ? 'Time is up' : isGiver() && game.clues.length >= 6 ? 'All clues sent' : isGiver() ? 'Send clue' : 'Guess word' }}</button>
            </form>
            <div aria-live="polite">@for (guess of game.guesses; track $index) { <p>{{ name(guess.playerId) }}: {{ guess.text }}</p> }</div>
          </section>
        } @else if (game.phase === 'REVEAL') {
          <section><p>The word was</p><strong class="secret">{{ game.answer }}</strong><h2>{{ game.outcome }}</h2>
            @if (isHost()) { <button class="primary" (click)="next()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button> }
            @else { <p>Waiting for the host to continue.</p> }
          </section>
        } @else { <section><h2>Words well spent</h2><p>{{ game.outcome }}</p></section> }
        <section><h2>Scores</h2>@for (player of standings(); track player.id) { <div class="row"><span>{{ name(player.id) }}</span><b>{{ player.score }}</b></div> }</section>
      </article>
    }
  ` })
export class RestrictedCluesComponent {
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>(); readonly isHost = input.required<boolean>();
  readonly action = output<PlayerAction>(); readonly text = signal('');
  readonly view = computed(() => this.room().activeGame?.publicView as CluesPublicView | null);
  readonly ownView = computed(() => this.privateView() as CluesPlayerView | null);
  readonly isGiver = computed(() => this.view()?.giver === this.playerId());
  private readonly round = computed(() => this.view()?.round);
  private readonly now = useClock();
  readonly seconds = computed(() => Math.max(0, Math.ceil(((this.view()?.timerEndsAt ?? 0) - this.now()) / 1000)));
  readonly unavailable = computed(() => this.view()?.phase !== 'CLUES' || this.seconds() === 0 || (this.isGiver() && (this.view()?.clues.length ?? 0) >= 6));
  readonly standings = computed(() => this.room().players.map(p => ({ id: p.id, score: this.view()?.scores[p.id] ?? 0 })).sort((a,b) => b.score-a.score));
  constructor() { effect(() => { this.round(); this.text.set(''); }); }
  name(id: string): string { return this.room().players.find(p => p.id === id)?.nickname ?? 'Departed player'; }
  send(): void { if (!this.unavailable() && this.text().trim()) { this.action.emit({ type: this.isGiver() ? 'CLUES_GIVE' : 'CLUES_GUESS', round: this.view()!.round, text: this.text() }); this.text.set(''); } }
  next(): void { this.action.emit({ type: 'CLUES_NEXT', round: this.view()!.round }); }
}
