import { Component, computed, effect, input, output, signal } from '@angular/core';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { MajorityChoice, MajorityPrediction, MajorityPublicView, MajorityPlayerView } from '@nightshift/games-majority-rules';
import { gameStyles } from '../game-styles';
import { useClock } from '../../shared/clock';
import { GameScoresComponent } from '../../shared/game-scores.component';

@Component({ selector: 'ns-majority-rules', standalone: true, imports: [GameScoresComponent], styles: [gameStyles], template: `
  @if (view(); as game) {
    <article>
      <header><p>Round {{ game.round }} / {{ game.maxRounds }}</p><h1>Majority Rules</h1></header>
      @if (game.phase === 'SUBMISSION') {
        <section>
          <p>{{ seconds() }}s to lock in · {{ game.submittedPlayerIds.length }} submitted</p>
          <h2>{{ game.prompt.question }}</h2>
          @if (!participating()) { <p>You joined mid-round. Watch the reveal and play next round.</p> }
          <h2>1. Your own choice</h2>
          @for (option of game.prompt.options; track $index) {
            <button [disabled]="seconds() === 0 || locked() || !participating()" [attr.aria-pressed]="selectedChoice() === choices[$index]"
              [class.selected]="selectedChoice() === choices[$index]" (click)="choice.set(choices[$index]!)">{{ choices[$index] }} · {{ option }}</button>
          }
          <h2>2. Predict everyone else</h2>
          <p>Your answer is excluded. A correct prediction earns 100 points.</p>
          @for (predictionOption of predictions(); track predictionOption) {
            <button [disabled]="seconds() === 0 || locked() || !participating()" [attr.aria-pressed]="selectedPrediction() === predictionOption"
              [class.selected]="selectedPrediction() === predictionOption" (click)="prediction.set(predictionOption)">Predict {{ label(predictionOption) }}</button>
          }
          <button class="primary" [disabled]="seconds() === 0 || locked() || !participating() || !choice() || !prediction()" (click)="submit()">{{ locked() ? 'Choices locked' : seconds() === 0 ? 'Time is up' : 'Lock answer and prediction' }}</button>
        </section>
      } @else if (game.phase === 'REVEAL') {
        <section aria-live="polite"><h2>{{ game.prompt.question }}</h2>
          <div class="poll-board" aria-label="All submitted answers">
            @for (side of choices; track side; let i=$index) {
              <div class="poll-side"><div><strong>{{ side }}</strong><span>{{ game.prompt.options[i] }}</span><b>{{ game.result?.counts?.[side] ?? 0 }} votes</b></div><div class="poll-track" aria-hidden="true"><span [style.width.%]="share(side)"></span></div></div>
            }
            <small>This chart includes everyone. Your prediction is scored against the other players only.</small>
          </div>
          @for (entry of game.result?.entries ?? []; track entry.playerId) {
            <div class="row"><span>{{ name(entry.playerId) }} chose {{ entry.choice }}<br>
              Predicted {{ label(entry.prediction) }} · Others: {{ entry.actual === null ? 'No other answers' : label(entry.actual) }}</span><b>+{{ entry.points }}</b></div>
          }
          @if (!game.result?.entries?.length) { <p>No answers this round. No points awarded.</p> }
          <small>Players without another submitted answer receive no points.</small>
          @if (isHost()) { <button class="primary" (click)="next()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button> }
          @else { <p>Waiting for the host.</p> }
        </section>
      } @else { <section><h2>Room-reading complete</h2><p>Did you know your coworkers as well as you thought?</p></section> }
      <ns-game-scores [room]="room()" [scores]="game.scores" />
    </article>
  }
` })
export class MajorityRulesComponent {
  share(side:MajorityChoice):number {const c=this.view()?.result?.counts;return c && c.A+c.B ? c[side]/(c.A+c.B)*100:0;}
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>(); readonly isHost = input.required<boolean>(); readonly action = output<PlayerAction>();
  readonly view = computed(() => this.room().activeGame?.publicView as MajorityPublicView | null);
  readonly own = computed(() => this.privateView() as MajorityPlayerView | null);
  readonly choice = signal<MajorityChoice | null>(null); readonly prediction = signal<MajorityPrediction | null>(null);
  readonly choices = ['A', 'B'] as const;
  readonly predictions = computed<readonly MajorityPrediction[]>(() => this.view()?.participants.length === 2 ? ['A', 'B'] : ['A', 'B', 'TIE']);
  readonly locked = computed(() => this.view()?.submittedPlayerIds.includes(this.playerId() ?? '') ?? false);
  readonly participating = computed(() => this.view()?.participants.includes(this.playerId() ?? '') ?? false);
  readonly selectedChoice = computed(() => this.locked() && this.own()?.round === this.view()?.round ? this.own()?.submission?.choice : this.choice());
  readonly selectedPrediction = computed(() => this.locked() && this.own()?.round === this.view()?.round ? this.own()?.submission?.prediction : this.prediction());
  private readonly round = computed(() => this.view()?.round); private readonly now = useClock();
  readonly seconds = computed(() => Math.min(30, Math.max(0, Math.ceil(((this.view()?.timerEndsAt ?? 0) - this.now()) / 1000))));
  constructor() { effect(() => { this.round(); this.choice.set(null); this.prediction.set(null); }); }
  label(prediction: MajorityPrediction): string { return prediction === 'TIE' ? 'a tie' : prediction; }
  name(id: string): string { return this.room().players.find(p => p.id === id)?.nickname ?? 'Departed player'; }
  submit(): void { if (this.seconds() > 0 && !this.locked() && this.participating() && this.choice() && this.prediction()) this.action.emit({type:'MAJORITY_SUBMIT',round:this.view()!.round,choice:this.choice()!,prediction:this.prediction()!}); }
  next(): void { this.action.emit({type:'MAJORITY_NEXT',round:this.view()!.round}); }
}
