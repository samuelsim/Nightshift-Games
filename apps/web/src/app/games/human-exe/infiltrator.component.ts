import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { InfiltratorPublicView, InfiltratorPlayerView } from '@nightshift/games-human-exe';
import { useClock } from '../../shared/clock';
import { gameStyles } from '../game-styles';
import { GameScoresComponent } from '../../shared/game-scores.component';

@Component({selector:'ns-infiltrator',standalone:true,imports:[FormsModule,GameScoresComponent],styles:[gameStyles,`
  .directive{border-left:4px solid var(--cyan);padding:1rem;background:#73d9ff0b;border-radius:8px}.directive strong{font-family:ui-monospace,monospace;color:var(--cyan)}
  .transmissions{display:grid;gap:.8rem}.transmission{padding:1rem;border:1px solid var(--line);border-radius:12px;background:var(--surface-strong);animation:transmission-in .3s ease both}.transmission p{color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}.transmission small{font-family:ui-monospace,monospace;color:var(--cyan)}.transmission.detected{border-color:var(--gold)}.transmission button{width:100%;margin-top:.8rem}
  textarea{resize:vertical;min-height:110px;padding:.8rem;border:1px solid var(--line);border-radius:10px;background:var(--surface-strong);color:var(--text);font:inherit;width:100%;box-sizing:border-box}.signal-note{color:var(--cyan);font-size:.8rem} @keyframes transmission-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`],template:`
  @if (view(); as game) {
    <article><header><p>Round {{ game.round }} / {{ game.maxRounds }}</p><h1>Human.exe: Infiltrator</h1></header>
      <section>
        @if (game.phase !== 'REVEAL' && game.phase !== 'RESULTS') {
          @if (privateReady()) {
            <div class="directive"><strong>{{ own()?.role === 'MACHINE' ? 'PRIVATE · YOU ARE THE MACHINE' : 'PRIVATE · YOU ARE HUMAN' }}</strong>
              <p>{{ own()?.role === 'MACHINE' ? 'Blend in. Include your secret word naturally, as a whole word:' : 'Answer naturally. One player has a secret word they must slip into their response.' }}</p>
              @if (own()?.codeWord) { <strong>{{ own()?.codeWord }}</strong> }
            </div>
          } @else { <p>{{ participating() ? 'Receiving your private directive…' : 'You join next round. Watch the signals.' }}</p> }
        }
        <h2>{{ game.question }}</h2>
        @if (game.phase === 'SUBMISSION') {
          <p>30 seconds. Write 3–160 characters. Avoid names or clues about who wrote it.</p>
          @if (privateReady()) {
            <form (ngSubmit)="submit()"><label for="infiltrator-response">Your anonymous response</label>
              <textarea id="infiltrator-response" name="response" maxlength="160" [ngModel]="response()" (ngModelChange)="response.set($event)" [disabled]="locked() || expired()"></textarea>
              <small>{{ response().length }} / 160 characters</small>
              <button class="primary" type="submit" [disabled]="locked() || expired() || response().trim().length < 3">{{ locked() ? 'Response locked' : expired() ? 'Time is up' : 'Lock response' }}</button>
            </form>
            @if (locked()) { <p>Your locked response: {{ own()?.response }}</p> }
          }
          <p aria-live="polite">{{ game.submittedPlayerIds.length }} / {{ game.participants.length }} responses locked. All appear together.</p>
        }
        @if (game.phase === 'DISCUSSION' || game.phase === 'VOTING') {
          <h2>{{ game.phase === 'DISCUSSION' ? 'Read the anonymous transmissions' : 'Which response came from the machine?' }}</h2>
          <p>{{ game.phase === 'DISCUSSION' ? '20 seconds to compare. Discuss aloud using card letters; keep authors secret. Voting opens next.' : 'One vote, 20 seconds. Pick another response; your ballot stays secret until reveal.' }}</p>
          @if (participating() && !game.submittedPlayerIds.includes(playerId() ?? '')) { <p>You did not submit a response. Watch the vote and play next round.</p> }
          <div class="transmissions">@for (card of game.cards; track card.id) {
            <div class="transmission"><small>TRANSMISSION {{ card.id }} {{ own()?.ownCard === card.id ? '· YOUR RESPONSE' : '' }}</small><p>{{ card.text }}</p>
              @if (game.phase === 'VOTING') { <button [class.selected]="own()?.vote === card.id" [attr.aria-pressed]="own()?.vote === card.id" [disabled]="!canVote() || own()?.ownCard === card.id" (click)="vote(card.id)">{{ own()?.vote === card.id ? 'Vote locked' : own()?.ownCard === card.id ? 'Your response' : 'Flag ' + card.id + ' as machine' }}</button> }
            </div>
          }</div>
          @if (game.phase === 'VOTING') { <p aria-live="polite">{{ game.votedPlayerIds.length }} ballots locked</p> }
        }
        @if (game.phase === 'REVEAL' && game.result; as result) {
          <h2>{{ result.voided ? 'Signal lost · round voided' : result.accused === result.machine ? 'Machine detected' : 'Machine undetected' }}</h2>
          <p>{{ result.explanation }}</p><p><b>{{ name(result.machine) }}</b> was the machine. Secret word: <b>{{ result.codeWord }}</b>.</p>
          <p>Accused: {{ result.accused ? name(result.accused) : 'Nobody' }}</p>
          <div class="transmissions">@for (card of game.cards; track card.id) {
            <div class="transmission" [class.detected]="result.authors[card.id] === result.machine"><small>{{ card.id }} · {{ name(result.authors[card.id]!) }} · {{ result.authors[card.id] === result.machine ? 'MACHINE' : 'HUMAN' }}</small><p>{{ card.text }}</p></div>
          }</div>
          @for (id of game.participants; track id) { <div class="row"><span>{{ name(id) }} → {{ result.votes[id] ? 'Card ' + result.votes[id] : 'No vote' }}</span><b>+{{ result.points[id] ?? 0 }}</b></div> }
          @if (isHost()) { <button class="primary" (click)="next()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button> } @else { <p>Waiting for the host to continue.</p> }
        }
        @if (game.phase === 'RESULTS') { <h2>Transmission complete</h2><p>Identity checks finished. Trust issues may persist.</p> }
      </section><ns-game-scores [room]="room()" [scores]="game.scores" />
    </article>
  }
`})
export class InfiltratorComponent {
  readonly room=input.required<RoomView>(); readonly playerId=input.required<string|null>(); readonly privateView=input.required<unknown>(); readonly isHost=input.required<boolean>(); readonly action=output<PlayerAction>();
  readonly view=computed(()=>this.room().activeGame?.publicView as InfiltratorPublicView|null);
  readonly own=computed(()=>this.privateView() as InfiltratorPlayerView|null);
  readonly response=signal(''); private readonly round=computed(()=>this.view()?.round); private readonly now=useClock();
  readonly expired=computed(()=>!this.view()?.timerEndsAt || this.now()>=this.view()!.timerEndsAt);
  readonly participating=computed(()=>this.view()?.participants.includes(this.playerId()??'')??false);
  readonly privateReady=computed(()=>this.participating() && this.own()?.round===this.view()?.round && !!this.own()?.role);
  readonly locked=computed(()=>this.view()?.submittedPlayerIds.includes(this.playerId()??'')??false);
  readonly canVote=computed(()=>this.view()?.phase==='VOTING'&&!this.expired()&&this.privateReady()&&this.locked()&&!this.view()?.votedPlayerIds.includes(this.playerId()??''));
  constructor(){effect(()=>{this.round();this.response.set('');});}
  submit():void {if(this.view()?.phase==='SUBMISSION'&&this.privateReady()&&!this.expired()&&!this.locked()) this.action.emit({type:'INFILTRATOR_RESPOND',round:this.view()!.round,text:this.response()});}
  vote(cardId:string):void {if(this.canVote()&&cardId!==this.own()?.ownCard)this.action.emit({type:'INFILTRATOR_VOTE',round:this.view()!.round,cardId});}
  next():void {this.action.emit({type:'INFILTRATOR_NEXT',round:this.view()!.round});}
  name(id:string):string{return this.room().players.find(p=>p.id===id)?.nickname??'Departed player';}
}
