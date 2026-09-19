import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { OneOfUsPublicView, OneOfUsPlayerView } from '@nightshift/games-one-of-us';
import { gameStyles } from '../game-styles';
import { useClock } from '../../shared/clock';
import { GameScoresComponent } from '../../shared/game-scores.component';

@Component({ selector: 'ns-one-of-us', standalone: true, imports: [FormsModule, GameScoresComponent], styles: [gameStyles, '.row span { overflow-wrap: anywhere; min-width: 0; }'], template: `
  @if (view(); as game) {
    <article>
      <header><p>Round {{ game.round }} / {{ game.maxRounds }}</p><h1>One of Us Is Lying</h1></header>
      @if (game.phase !== 'RESULTS' && game.phase !== 'REVEAL') {
        <section>
          <h2>{{ phaseLabel() }} · {{ seconds() }}s left</h2>
          <p>Category: {{ game.category }}</p>
          @if (own()?.round === game.round && own()?.role; as role) {
            <strong class="secret">{{ role === 'BLUFFER' ? 'You are bluffing' : own()?.word }}</strong>
            <p>{{ role === 'BLUFFER' ? 'You only know the category. Blend in and avoid the accusation.' : 'You know the word. Give a useful clue without spelling it out.' }}</p>
          } @else { <p>You joined mid-round. You will receive a role next round.</p> }
          @if (game.phase === 'CLUES') {
            <p>Clues stay hidden until everyone locks in or time runs out.</p>
            @if (participating()) {
              <form (ngSubmit)="sendClue()"><label for="lying-clue">Your clue · 1–3 words</label>
                <input id="lying-clue" name="clue" [ngModel]="clue()" (ngModelChange)="clue.set($event)" maxlength="60" autocomplete="off" [disabled]="seconds() === 0 || clueLocked()" />
                <button class="primary" type="submit" [disabled]="seconds() === 0 || clueLocked() || !clue().trim()">{{ clueLocked() ? 'Clue locked' : seconds() === 0 ? 'Time is up' : 'Lock clue' }}</button>
              </form>
              @if (clueLocked()) { <p>Your clue: {{ own()?.clue }}</p> }
            }
            <p aria-live="polite">{{ game.submittedPlayerIds.length }} / {{ game.participants.length }} clues locked</p>
          }
          @if (game.phase === 'DISCUSSION' || game.phase === 'VOTING') {
            <h2>Everyone's clues</h2>
            @for (id of game.participants; track id) { <div class="row"><b>{{ name(id) }}</b><span>{{ game.clues[id] ?? 'No clue submitted' }}</span></div> }
            @if (game.phase === 'DISCUSSION') {
              <p>Discuss who is bluffing. Four short messages each; voting opens when the timer ends.</p>
              <div class="discussion-feed" aria-live="polite">@for (message of game.discussion; track $index) { <div class="row"><b>{{ name(message.playerId) }}</b><span>{{ message.text }}</span></div> }</div>
              @if (participating()) {
                <form (ngSubmit)="sendMessage()"><label for="lying-message">Discussion message · {{ own()?.messagesRemaining ?? 0 }} left</label>
                  <input id="lying-message" name="message" [ngModel]="message()" (ngModelChange)="message.set($event)" maxlength="160" autocomplete="off" [disabled]="seconds() === 0 || !own()?.messagesRemaining" />
                  <button type="submit" [disabled]="seconds() === 0 || !message().trim() || !own()?.messagesRemaining">Send message</button>
                </form>
              }
            } @else {
              <h2>Who is bluffing?</h2><p>One private vote. You cannot vote for yourself.</p>
              @for (id of game.participants; track id) {
                @if (id !== playerId()) { <button [disabled]="seconds() === 0 || !participating() || voteLocked()" [class.selected]="own()?.vote === id"
                  [attr.aria-pressed]="own()?.vote === id" (click)="vote(id)">Accuse {{ name(id) }}</button> }
              }
              <p aria-live="polite">{{ game.votedPlayerIds.length }} / {{ game.participants.length }} votes locked</p>
              <small>Tied or empty votes mean no accusation. An uncaught bluffer earns 200 points.</small>
            }
          }
        </section>
      } @else if (game.phase === 'REVEAL') {
        <section aria-live="polite"><h2>{{ game.result?.explanation }}</h2>
          <p>The word was <strong class="secret">{{ game.result?.word }}</strong></p>
          <div class="case-reveal"><span class="case-stamp">{{ game.result?.voided ? 'VOIDED' : game.result?.accused === game.result?.bluffer ? 'CAUGHT' : 'ESCAPED' }}</span><div><small>THE BLUFFER</small><strong>{{ name(game.result!.bluffer) }}</strong></div><div><small>THE ROOM ACCUSED</small><strong>{{ game.result?.accused ? name(game.result!.accused!) : 'Nobody' }}</strong></div></div>
          @for (id of game.participants; track id) { <div class="row"><span>{{ name(id) }} → {{ game.result?.votes?.[id] ? name(game.result!.votes[id]!) : 'No vote' }}</span><b>+{{ game.result?.points?.[id] ?? 0 }}</b></div> }
          @if (isHost()) { <button class="primary" (click)="next()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button> }
          @else { <p>Waiting for the host.</p> }
        </section>
      } @else { <section><h2>Trust issues resolved. Probably.</h2><p>The final scores are in.</p></section> }
      <ns-game-scores [room]="room()" [scores]="game.scores" />
    </article>
  }
` })
export class OneOfUsComponent {
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>(); readonly isHost = input.required<boolean>(); readonly action = output<PlayerAction>();
  readonly view = computed(() => this.room().activeGame?.publicView as OneOfUsPublicView | null);
  readonly own = computed(() => this.privateView() as OneOfUsPlayerView | null);
  readonly clue = signal(''); readonly message = signal(''); private readonly round = computed(() => this.view()?.round);
  readonly participating = computed(() => this.view()?.participants.includes(this.playerId() ?? '') ?? false);
  readonly clueLocked = computed(() => this.view()?.submittedPlayerIds.includes(this.playerId() ?? '') ?? false);
  readonly voteLocked = computed(() => this.view()?.votedPlayerIds.includes(this.playerId() ?? '') ?? false);
  private readonly now = useClock();
  readonly seconds = computed(() => Math.min(this.view()?.phase === 'VOTING' ? 20 : 30, Math.max(0, Math.ceil(((this.view()?.timerEndsAt ?? 0) - this.now()) / 1000))));
  readonly phaseLabel = computed(() => this.view()?.phase === 'CLUES' ? 'Write a clue' : this.view()?.phase === 'DISCUSSION' ? 'Discuss the clues' : 'Vote for the bluffer');
  constructor() { effect(() => { this.round(); this.clue.set(''); this.message.set(''); }); }
  name(id: string): string { return this.room().players.find(p => p.id === id)?.nickname ?? 'Departed player'; }
  sendClue(): void { if (this.seconds() === 0 || !this.participating() || this.clueLocked() || this.view()?.phase !== 'CLUES') return; this.action.emit({type:'LYING_CLUE',round:this.view()!.round,text:this.clue()}); }
  sendMessage(): void { if (this.seconds() === 0 || !this.participating() || !this.own()?.messagesRemaining || this.view()?.phase !== 'DISCUSSION') return; this.action.emit({type:'LYING_DISCUSS',round:this.view()!.round,text:this.message()}); this.message.set(''); }
  vote(targetPlayerId: string): void { if (this.seconds() === 0 || !this.participating() || this.voteLocked() || this.view()?.phase !== 'VOTING') return; this.action.emit({type:'LYING_VOTE',round:this.view()!.round,targetPlayerId}); }
  next(): void { this.action.emit({type:'LYING_NEXT',round:this.view()!.round}); }
}
