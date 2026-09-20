import { Component, computed, effect, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PlayerAction, RoomView } from '@nightshift/protocol';
import type { EstimatePlayerView, EstimatePublicView } from '@nightshift/games-estimate';
import { useClock } from '../../shared/clock';
import { estimateDeckLabels } from '@nightshift/protocol/room';

@Component({
  selector: 'ns-estimate', standalone: true, imports: [FormsModule, DecimalPipe],
  template: `
    @if (view(); as game) {
      <article>
        <header><span>Round {{ game.round }} / {{ game.maxRounds }}</span><h1>Estimate</h1></header>
        <div class="edition"><span>{{ deckLabels[game.deck] }}</span><span>{{ game.difficulty }} · 30s / round</span></div>
        @if (game.dailyId) { <aside class="daily-stamp"><strong>★ DAILY CHALLENGE · {{ game.dailyId.split(':')[1] }} UTC</strong><span>Same questions on replay. First and best scores saved.</span></aside> }
        @if (game.phase === 'SUBMISSION') {
          <section>
            <h2>{{ game.prompt.question }}</h2>
            @if (game.prompt.convention) { <p class="convention">{{ game.prompt.convention }}</p> }
            <form (ngSubmit)="submit()">
              <label for="estimate-value">Your estimate ({{ game.prompt.unit }})</label>
              <input id="estimate-value" name="estimate" type="number" inputmode="decimal" min="0"
                max="1000000000" step="any" autocomplete="off" placeholder="0"
                [ngModel]="value()" (ngModelChange)="value.set($event)" [disabled]="locked() || expired()" />
              <button class="primary" type="submit" [disabled]="locked() || expired() || !valid()">{{ locked() ? 'Estimate locked' : expired() ? 'Time is up' : 'Lock estimate' }}</button>
            </form>
            @if (locked()) { <p>Your estimate: {{ ownView()?.submittedValue | number }} {{ game.prompt.unit }}</p> }
            <p aria-live="polite">{{ game.submittedPlayerIds.length }} locked in · {{ connectedCount() }} connected</p>
            <details><summary>How scoring works</summary><p>Up to 1,000 points for accuracy. Each 1% error costs 10 points.
              Stay within 10% to build a streak: +100 for your second close guess, +200 for your third, then +300 per round.
              Closest guesses share round bragging rights. You have 30 seconds; missing the deadline earns no points and resets your streak.</p></details>
          </section>
        }
        @if (game.phase === 'REVEAL') {
          @if (game.latestResult; as result) {
            <section aria-live="polite">
              <h2>{{ result.prompt.question }}</h2>
              <p>The answer is</p><strong class="answer">{{ result.prompt.answer | number }}</strong>
              <p>{{ result.prompt.unit }} · {{ result.prompt.explanation }}</p>
              @if (result.prompt.source; as source) {
                <aside class="source-note"><span>✦ DISCOVERY FILE</span>
                  <a [href]="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a>
                  <small>Source reviewed {{ source.reviewedAt }} · Rounded reference value; close estimates still earn points.</small>
                </aside>
              }
              @if (ownResult(); as guess) {
                <div class="accuracy-instrument" aria-label="Your estimate compared with the answer">
                  <div class="instrument-heading"><span>YOUR GUESS / ACTUAL ANSWER</span><strong>{{ guess.errorPercent | number:'1.0-1' }}% off</strong></div>
                  <div class="accuracy-track" aria-hidden="true"><span class="accuracy-zone"></span><span class="answer-pin"></span><span class="guess-pin" [style.left.%]="guessPosition()">▼</span></div>
                  <div class="instrument-scale"><span>0×</span><b>1× · exact</b><span>2×+</span></div>
                  <p>{{ guess.value < result.prompt.answer ? 'Your estimate was below the answer.' : guess.value > result.prompt.answer ? 'Your estimate was above the answer.' : 'Perfectly calibrated.' }}</p>
                </div>
              }
              @for (guess of result.guesses; track guess.playerId) {
                <div class="result" [class.winner]="result.winners.includes(guess.playerId)">
                  <div><b>{{ name(guess.playerId) }}{{ result.winners.includes(guess.playerId) ? ' · Closest' : '' }}</b>
                    <span>{{ guess.value | number }} · {{ guess.errorPercent | number:'1.0-1' }}% off</span></div>
                  <div><b>+{{ guess.points | number }}</b><span>{{ guess.grade }} · Streak {{ guess.streak }}</span></div>
                </div>
              }
              @if (isHost()) {
                <button class="primary" (click)="advance()">{{ game.round === game.maxRounds ? 'Final scores' : 'Next round' }}</button>
              } @else { <p>Waiting for the host to continue.</p> }
            </section>
          }
        }
        @if (game.phase === 'RESULTS') {
          <section>
            <h2>Shift complete</h2><p>{{ game.maxRounds }} rounds complete.</p>
            @for (score of standings(); track score.id) {
              <div class="result"><b>{{ name(score.id) }}</b><b>{{ score.score | number }} points</b></div>
            }
            <p>Vote for the next game below.</p>
          </section>
        }
      </article>
    }
  `,
  styles: [`
    article { display: grid; gap: .65rem; max-width: 760px; margin: 0 auto; }
    .daily-stamp{display:grid;gap:.5rem;padding:1rem;border:1px dashed var(--gold);border-radius:12px;background:var(--surface-strong)}.daily-stamp strong{font-size:.75rem;letter-spacing:.05em;color:var(--gold)}.daily-stamp span{font-size:.8rem;color:var(--muted);line-height:1.5}
    .edition{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;padding:.5rem .7rem;border:1px solid var(--gold);border-radius:12px;color:var(--gold);font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800}
    .convention{font-size:.8rem}.source-note{display:grid;gap:.55rem;padding:1rem;border:1px dashed var(--cyan);border-radius:12px;background:var(--surface-strong);animation:discovery-in .35s ease-out}.source-note span{color:var(--cyan);font-size:.65rem;letter-spacing:.12em;font-weight:900}.source-note a{color:var(--text);font-weight:800;overflow-wrap:anywhere}.source-note small{color:var(--muted);line-height:1.5}@keyframes discovery-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    section, form { display: grid; gap: .65rem; }
    section { padding: 1rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
    h1, h2, p { margin: 0; } h1 { font-size: clamp(2rem, 9vw, 3.8rem); }
    h2 { font-size: clamp(1.3rem, 5vw, 1.8rem); line-height: 1.3; }
    p, header span, .result span { color: var(--muted); }
    .eyebrow { color: var(--gold); } label, button, summary { font-weight: 800; }
    input, button { min-height: 54px; border: 1px solid var(--line); border-radius: 8px; padding: .7rem; font: inherit; }
    input { width: 100%; min-width: 0; background: var(--surface-strong); color: var(--text); font-size: 1.5rem; }
    button { cursor: pointer; background: var(--mint); color: #141414; font-weight: 900; }
    button:disabled { opacity: .5; cursor: default; } summary { cursor: pointer; padding: .5rem 0; }
    .answer { font-size: clamp(2.5rem, 12vw, 5rem); line-height: 1; color: var(--rose); overflow-wrap: anywhere; }
    .result { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .6rem; padding: .8rem; border: 1px solid var(--line); border-radius: 8px; }
    .result div { display: grid; gap: .3rem; } .result span { font-size: .9rem; } .winner { border-color: var(--mint); }
  `]
})
export class EstimateComponent {
  readonly deckLabels = estimateDeckLabels;
  readonly room = input.required<RoomView>();
  readonly playerId = input.required<string | null>();
  readonly privateView = input.required<unknown>();
  readonly isHost = input.required<boolean>();
  readonly action = output<PlayerAction>();
  readonly returnToLobby = output<void>();
  readonly value = signal<number | null>(null);
  private readonly now = useClock();
  readonly expired = computed(() => !!this.view()?.timerEndsAt && this.now() >= this.view()!.timerEndsAt);
  readonly view = computed(() => this.room().activeGame?.publicView as EstimatePublicView | null);
  readonly ownResult = computed(() => this.view()?.latestResult?.guesses.find(g => g.playerId === this.playerId()));
  readonly guessPosition = computed(() => {
    const answer = this.view()?.latestResult?.prompt.answer || 1;
    return Math.min(100, Math.max(0, (this.ownResult()?.value ?? 0) / answer * 50));
  });
  readonly ownView = computed(() => this.privateView() as EstimatePlayerView | null);
  private readonly currentRound = computed(() => this.view()?.round);
  readonly locked = computed(() => this.view()?.submittedPlayerIds.includes(this.playerId() ?? '') ?? false);
  readonly valid = computed(() => typeof this.value() === 'number' && Number.isFinite(this.value()) && this.value()! >= 0 && this.value()! <= 1_000_000_000);
  readonly connectedCount = computed(() => this.room().players.filter((p) => p.connected).length);
  readonly standings = computed(() => Object.entries(this.view()?.scores ?? {}).map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score));

  constructor() {
    effect(() => { this.currentRound(); this.value.set(null); });
  }
  name(id: string): string { return this.room().players.find((p) => p.id === id)?.nickname ?? 'Departed player'; }
  submit(): void {
    const round = this.view()?.round;
    if (round && this.valid() && !this.locked() && !this.expired()) this.action.emit({ type: 'ESTIMATE_SUBMIT', round, value: this.value()! });
  }
  advance(): void {
    const round = this.view()?.round;
    if (round) this.action.emit({ type: 'ESTIMATE_NEXT_ROUND', round });
  }
}
