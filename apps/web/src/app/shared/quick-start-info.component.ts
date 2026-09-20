import { Component, computed, input } from '@angular/core';
import { gameOptionFields } from '@nightshift/protocol/room';

const pace: Record<string,string> = {
  estimate:'30 seconds per estimate. Quantities uses generated number puzzles; Fresh shuffle chooses a new set.',
  'human-exe':'Standard includes decoy answers. Solo: match both roles in 15 seconds. With friends: follow your secret role, with no timer.',
  'pick-number':'Solo: three guesses in 20 seconds, with higher/lower hints. With friends: one pick each, with no timer.',
  'restricted-clues':'60 seconds to solve each word. The clue giver rotates each round.',
  'majority-rules':'30 seconds to choose an answer and predict everyone else.',
  'one-of-us':'30 seconds for clues, 30 to discuss, then 20 to vote. The bluffer rotates.',
  'human-infiltrator':'30 seconds to write, 20 to discuss, then 20 to vote. The machine rotates.'
};

@Component({selector:'ns-quick-start-info',standalone:true,template:`
  <details #info (keydown.escape)="info.open=false">
    <summary>ⓘ Quick start defaults</summary>
    <div class="defaults-sheet">
      <p class="default-values">{{ defaults() }}</p>
      <p>{{ explanation() }}</p>
      <small>Quick start uses these defaults. To customise, open Game settings. Guests still need to ready up.</small>
    </div>
  </details>
`,styles:[`
  :host{display:block}summary{font-size:.8rem;color:var(--muted);width:fit-content;padding:.5rem 0;cursor:pointer}
  .defaults-sheet{padding:.65rem .85rem;border-left:3px solid var(--cyan);background:var(--surface-strong);border-radius:0 8px 8px 0;animation:reveal-arrive .2s ease}
  p{margin:0 0 .45rem;font-size:.85rem;line-height:1.5}.default-values{color:var(--gold);font-weight:700}small{color:var(--muted);font-size:.75rem;line-height:1.5;display:block}
`]})
export class QuickStartInfoComponent {
  readonly gameId=input.required<string>();
  readonly defaults=computed(()=>(gameOptionFields[this.gameId()] ?? []).map(field=>`${field.label}: ${field.choices.find(choice=>choice.value===field.defaultValue)?.label}`).join(' · '));
  readonly explanation=computed(()=>pace[this.gameId()] ?? '');
}
