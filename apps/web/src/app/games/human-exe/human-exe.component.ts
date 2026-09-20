import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { useClock } from '../../shared/clock';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { HumanPublicView, HumanPlayerView } from '@nightshift/games-human-exe';
import { gameStyles } from '../game-styles';

@Component({ selector: 'ns-human-exe', standalone: true, styles: [gameStyles],
  template: `
    @if (view(); as game) {
      <article><header><p>Round {{ game.round }} / {{ game.maxRounds }}</p><h1>Human.exe</h1></header>
        @if (game.phase === 'CHOICE') {
          <section>
            @if (game.soloPlayerId) {
              <h2>Solo · Dual-core challenge</h2>
              <p>Classify both answers in 15 seconds. Each correct match earns 100 points. Get both right for 10 bonus points per full second remaining.</p>
              <h2>{{ game.question }}</h2>
              @if (game.soloPlayerId === playerId()) {
                <div class="dual-status" aria-live="polite"><span [class.online]="humanChoice() !== null">♥ HUMAN {{ humanChoice() !== null ? 'assigned' : 'waiting' }}</span><span [class.online]="machineChoice() !== null">▣ MACHINE {{ machineChoice() !== null ? 'assigned' : 'waiting' }}</span></div>
                <p>Assign one response to each system. @if (game.options.length > 2) { Leave the remaining {{ game.options.length === 3 ? 'decoy' : 'decoys' }} unassigned. }</p>
                <div class="response-deck">@for (option of game.options; track $index) {
                  <div class="response-card" [class.human-card]="humanChoice() === $index" [class.machine-card]="machineChoice() === $index">
                    <span class="response-number" aria-hidden="true">0{{ $index + 1 }}</span><p>{{ option }}</p>
                    <div class="assign-actions"><button type="button" [disabled]="soloUnavailable()" [attr.aria-label]="'Assign HUMAN: ' + option" [attr.aria-pressed]="humanChoice() === $index" (click)="assign('human',$index)">♥ Human</button><button type="button" [disabled]="soloUnavailable()" [attr.aria-label]="'Assign MACHINE: ' + option" [attr.aria-pressed]="machineChoice() === $index" (click)="assign('machine',$index)">▣ Machine</button></div>
                  </div>
                }</div>
                <button class="primary" [disabled]="soloUnavailable() || humanChoice() === null || machineChoice() === null || humanChoice() === machineChoice()" (click)="submitPair()">{{ expired() ? 'Time is up' : 'Lock both answers' }}</button>
              } @else { <p>You join next round. Watch this challenge!</p> }
            } @else {
            @if (ownView()?.round === game.round && ownView()?.role; as role) {
              <p>Your private directive</p><strong class="secret">{{ role }}</strong>
              <p>{{ role === 'HUMAN' ? 'Choose warmth, empathy, or shared humour.' : 'Choose measurement, structured data, or literal system status.' }} Match the directive for 100 points.</p>
            } @else { <p>Your directive arrives next round. Watch this reveal!</p> }
            <h2>{{ game.question }}</h2>
            @for (option of game.options; track $index) {
              <button [class.selected]="ownView()?.choice === $index" [disabled]="locked() || !ownView()?.role || ownView()?.round !== game.round" (click)="choose($index)">{{ option }}</button>
            }
            <p aria-live="polite">{{ game.submittedPlayerIds.length }} choices locked. Directives stay secret until reveal.</p>
            }
            <small>These are playful authored answers, not a test of real humanity. You may disagree at reveal.</small>
          </section>
        } @else if (game.phase === 'REVEAL') {
          <section><h2>{{ game.question }}</h2><p>{{ game.result?.explanation }}</p>
            @if (game.soloResult; as result) {
              <p>{{ result.correctCount }} / 2 matched · +{{ result.bonus }} speed bonus</p>
              <div class="row"><span>HUMAN: {{ game.options[game.result!.humanAnswer] }}<br>Your choice: {{ result.humanChoice === null ? 'No answer' : game.options[result.humanChoice] }}</span></div>
              <div class="row"><span>MACHINE: {{ game.options[game.result!.machineAnswer] }}<br>Your choice: {{ result.machineChoice === null ? 'No answer' : game.options[result.machineChoice] }}</span></div>
            }
            @for (choice of game.result?.choices ?? []; track choice.playerId) {
              <div class="row"><span>{{ name(choice.playerId) }} · {{ choice.role }}<br>{{ game.options[choice.choice] }}</span><b>+{{ choice.points }}</b></div>
            }
            @if (isHost()) { <button class="primary" (click)="next()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button> }
            @else { <p>Waiting for the host to continue.</p> }
          </section>
        } @else { <section><h2>Diagnostics complete</h2><p>Your humanity remains inconclusive. Your points do not.</p></section> }
        <section><h2>Scores</h2>@for (score of standings(); track score.id) { <div class="row"><span>{{ name(score.id) }}</span><b>{{ score.score }}</b></div> }</section>
      </article>
    }
  ` })
export class HumanExeComponent {
  private readonly feedback = inject(FeedbackService);
  assign(role:'human'|'machine',index:number):void {
    if (this.soloUnavailable()) return;
    const own=role==='human'?this.humanChoice:this.machineChoice;
    const other=role==='human'?this.machineChoice:this.humanChoice;
    if(own()===index) {own.set(null);return;}
    if(other()===index) other.set(null);
    own.set(index);this.feedback.play('assign');
  }
  readonly humanChoice = signal<number|null>(null); readonly machineChoice = signal<number|null>(null);
  private readonly round = computed(()=>this.view()?.round);
  constructor(){ effect(()=>{this.round();this.humanChoice.set(null);this.machineChoice.set(null);}); }
  submitPair():void { if(!this.soloUnavailable() && this.humanChoice()!==null && this.machineChoice()!==null && this.humanChoice() !== this.machineChoice()) this.action.emit({type:'HUMAN_SOLO_SUBMIT',round:this.view()!.round,humanChoice:this.humanChoice()!,machineChoice:this.machineChoice()!}); }
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>(); readonly isHost = input.required<boolean>(); readonly action = output<PlayerAction>();
  readonly view = computed(() => this.room().activeGame?.publicView as HumanPublicView | null);
  readonly ownView = computed(() => this.privateView() as HumanPlayerView | null);
  readonly locked = computed(() => this.view()?.submittedPlayerIds.includes(this.playerId() ?? '') ?? false);
  private readonly now = useClock();
  readonly expired = computed(() => !!this.view()?.timerEndsAt && this.now() >= this.view()!.timerEndsAt!);
  readonly soloUnavailable = computed(() => this.expired() || this.locked() || this.view()?.phase !== 'CHOICE' || this.view()?.soloPlayerId !== this.playerId());
  readonly standings = computed(() => this.room().players.map(p => ({ id: p.id, score: this.view()?.scores[p.id] ?? 0 })).sort((a,b) => b.score-a.score));
  name(id: string): string { return this.room().players.find(p => p.id === id)?.nickname ?? 'Departed player'; }
  choose(choice: number): void { this.action.emit({ type: 'HUMAN_CHOOSE', round: this.view()!.round, choice }); }
  next(): void { this.action.emit({ type: 'HUMAN_NEXT', round: this.view()!.round }); }
}
