import { Component, computed, input } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { roundOutcome } from '../services/round-outcome';

@Component({selector:'ns-round-outcome',standalone:true,template:`
  @if (result(); as result) {
    <section class="personal-result" [attr.data-outcome]="result.cue" [attr.data-game]="room().activeGame?.gameId" aria-label="Your round result">
      @if (result.cue === 'correct') { <div class="victory-burst" aria-hidden="true">@for (spark of [0,1,2,3,4,5,6,7]; track spark) { <i [style.--spark]="spark">✦</i> }</div> }
      <span class="outcome-stamp" aria-hidden="true">{{ result.cue === 'correct' ? '✦' : result.cue === 'close' ? '≈' : result.cue === 'incorrect' ? '↻' : '—' }}</span>
      <div><small>{{ resultLabel() }}</small><h2>{{ result.title }}</h2><p>{{ result.detail }}</p></div>
      <strong class="outcome-points">+{{ result.points }}<small>points</small></strong>
    </section>
  }
`, styles:[`
  .personal-result{--result-color:var(--cyan);display:flex;gap:1rem;align-items:center;max-width:760px;margin:0 auto 1.4rem;padding:1.2rem;border:2px solid var(--result-color);border-radius:18px;background:color-mix(in srgb,var(--result-color) 10%,#202020);animation:reveal-arrive .4s ease both}
  [data-outcome=correct]{--result-color:var(--mint)}[data-outcome=close]{--result-color:var(--gold)}[data-outcome=incorrect]{--result-color:#ffae79}
  .outcome-stamp{color:var(--result-color);font-size:2.5rem}.outcome-points{margin-left:auto;color:var(--result-color);font-size:1.7rem;white-space:nowrap}
  [data-outcome=correct] .outcome-stamp{animation:stamp-pop .55s ease both}
  [data-game=human-exe]{border-radius:4px;background-image:repeating-linear-gradient(0deg,transparent,transparent 4px,#73d9ff06 5px)}[data-game=human-exe] h2{font-family:ui-monospace,monospace}
  [data-game=estimate]{border-bottom-width:5px}[data-game=restricted-clues]{border-radius:22px 22px 22px 4px}
  [data-game=one-of-us]{border-style:dashed}[data-game=majority-rules] .outcome-points{border-bottom:4px solid currentColor}
  @keyframes stamp-pop{0%{transform:scale(.4) rotate(-20deg)}65%{transform:scale(1.2) rotate(8deg)}100%{transform:scale(1)}}
  small{display:block;font-size:.65rem;letter-spacing:.08em;color:var(--muted)}h2{font-size:1.25rem;margin:.2rem 0}p{margin:0;font-size:.85rem;line-height:1.5;color:var(--muted)}
  @media(max-width:480px){.personal-result{gap:.7rem;padding:.9rem;flex-wrap:wrap}.personal-result>div{flex:1;min-width:180px}.outcome-points{font-size:1.3rem}}
`]})
export class RoundOutcomeComponent {
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string|null>();
  readonly result = computed(() => roundOutcome(this.room(),this.playerId()));
  readonly resultLabel = computed(() => ({estimate:'LAB RESULTS','pick-number':'YOUR LUCK REPORT','restricted-clues':'CASE CRACKED?','human-infiltrator':'IDENTITY REVEAL','human-exe':'DIAGNOSTIC REPORT','majority-rules':'YOUR EXIT POLL','one-of-us':'THE CASE FILE'} as Record<string,string>)[this.room().activeGame?.gameId ?? ''] ?? 'YOUR ROUND');
}
