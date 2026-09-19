import { Component, computed, input } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { GameArtComponent } from './game-art.component';

const themes: Record<string,{label:string;caption:string}> = {
  'human-infiltrator':{label:'ANONYMOUS SIGNALS',caption:'Someone is trying very hard to sound human.'},
  estimate:{label:'THE GUESS LAB',caption:'A little instinct. A very big guess.'},
  'pick-number':{label:'LUCKY LITTLE NUMBERS',caption:'Ten possibilities. One lucky feeling.'},
  'restricted-clues':{label:'THE WORD VAULT',caption:'Say just enough. Never too much.'},
  'human-exe':{label:'PERSONALITY CHECK',caption:'Feelings loading. Logic standing by.'},
  'majority-rules':{label:'THE ROOM HAS OPINIONS',caption:'Pick a side. Read the room.'},
  'one-of-us':{label:'THE SUSPICION CLUB',caption:'Everybody looks a little suspicious.'}
};
@Component({selector:'ns-game-stage',standalone:true,imports:[GameArtComponent],template:`
  <div class="stage" [attr.data-scene]="id()" [class.revealed]="room().activeGame?.phase === 'REVEAL'">
    <div class="scene" aria-hidden="true">
      <svg viewBox="0 0 600 160" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        @switch (id()) {
          @case ('human-infiltrator') {
            <g class="left-prop"><circle cx="112" cy="78" r="43"/><circle cx="112" cy="78" r="25"/><path class="scan" d="M112 78L143 48"/><circle cx="98" cy="68" r="4"/><circle cx="127" cy="94" r="4"/></g>
            <g class="right-prop"><rect x="435" y="40" width="82" height="86" rx="9"/><path d="M450 60H496M450 77H479M450 94H492"/><text x="522" y="52">?</text></g>
          }
          @case ('estimate') {
            @switch (deck()) {
            @case ('earth') {
              <g class="left-prop"><circle cx="112" cy="80" r="42"/><path d="M78 57L96 48L114 62L104 82L123 96L116 121M143 55L127 75L145 91"/><path class="liquid" d="M63 136Q81 123 99 136T135 136T171 136"/></g>
              <g class="right-prop"><path class="liquid" d="M423 63Q442 49 461 63T499 63T537 63M423 110Q442 96 461 110T499 110"/><path d="M444 85Q467 62 490 85Q467 108 444 85L431 74V96Z"/><circle cx="479" cy="82" r="2"/></g>
            }
            @case ('wildlife') {
              <g class="left-prop"><path d="M87 119Q75 102 96 82Q110 63 125 82Q147 105 133 119Q113 110 87 119Z"/><ellipse cx="79" cy="71" rx="10" ry="15"/><ellipse cx="101" cy="54" rx="10" ry="15"/><ellipse cx="127" cy="55" rx="10" ry="15"/><ellipse cx="149" cy="76" rx="10" ry="15"/></g>
              <g class="right-prop"><path d="M467 125V75M467 96Q428 93 429 54Q467 53 467 96ZM469 80Q469 38 512 37Q510 79 469 80Z"/><path class="liquid" d="M440 125H501"/><circle cx="520" cy="105" r="5"/></g>
            }
            @case ('facts') {
              <g class="left-prop"><circle cx="113" cy="81" r="31"/><ellipse cx="113" cy="81" rx="62" ry="13" transform="rotate(-25 113 81)"/><circle cx="60" cy="40" r="3"/></g>
              <g class="right-prop"><circle cx="474" cy="81" r="37"/><circle cx="463" cy="65" r="9"/><circle cx="490" cy="90" r="12"/><path class="liquid" d="M524 35V51M516 43H532M420 109V125M412 117H428"/></g>
            }
            @default {
            <g class="left-prop"><path d="M50 112V50H181V112Z" fill="currentColor" fill-opacity=".06"/><path d="M64 50V65M80 50V75M96 50V65M112 50V75M128 50V65M144 50V75M160 50V65"/><text x="95" y="101">≈</text></g>
            <g class="right-prop"><path d="M438 46V100Q438 120 468 120Q498 120 498 100V46M432 46H504M440 90H496"/><path class="liquid" d="M441 83Q454 73 467 83T495 83"/><circle cx="466" cy="64" r="4"/><circle cx="480" cy="32" r="3"/></g>
            }
            }
          }
          @case ('pick-number') {
            <g class="left-prop"><rect x="75" y="49" width="75" height="75" rx="14" transform="rotate(-14 112 86)"/><circle cx="98" cy="71" r="5"/><circle cx="128" cy="100" r="5"/></g>
            <g class="right-prop"><circle cx="475" cy="82" r="42"/><circle cx="475" cy="82" r="33" stroke-dasharray="3 8"/><text x="465" y="94">?</text><path d="M416 38L407 28M526 126L536 136"/></g>
          }
          @case ('restricted-clues') {
            <g class="left-prop"><path d="M55 47H180V101H112L90 117V101H55Z"/><text x="76" y="84">•••</text><path d="M69 33H152" stroke-dasharray="3 8"/></g>
            <g class="right-prop"><rect x="438" y="69" width="72" height="54" rx="9"/><path d="M452 69V50Q474 20 496 50V69"/><circle cx="474" cy="93" r="5"/><path d="M474 98V107"/></g>
          }
          @case ('human-exe') {
            <g class="left-prop"><path d="M50 85H72L84 54L98 112L111 74L123 85H178"/><text x="67" y="137">HUMAN</text></g>
            <g class="right-prop"><rect x="445" y="46" width="60" height="60" rx="8"/><path d="M433 57H445M433 77H445M433 97H445M505 57H517M505 77H517M505 97H517M457 34V46M477 34V46M497 34V46"/><text x="449" y="137">MACHINE</text></g>
            <path class="scan" d="M208 28H391"/>
          }
          @case ('majority-rules') {
            <g class="left-prop"><path d="M68 124V96H89V124M104 124V74H125V124M140 124V48H161V124" fill="currentColor" fill-opacity=".12"/><text x="97" y="37">A</text></g>
            <g class="right-prop"><path d="M438 124V45H459V124M474 124V73H495V124M510 124V95H531V124" fill="currentColor" fill-opacity=".12"/><text x="480" y="34">B</text></g>
          }
          @case ('one-of-us') {
            <g class="left-prop"><circle cx="108" cy="70" r="32"/><path d="M130 96L157 123" stroke-width="10"/><path d="M94 71Q108 54 122 71Q108 87 94 71Z"/><circle cx="108" cy="71" r="4"/></g>
            <g class="right-prop"><path d="M437 37L510 48L496 127L423 116Z"/><path d="M447 61L488 68M444 77L484 84M441 94L465 98"/><text x="526" y="54">?</text></g>
          }
        }
        <path d="M195 131H406" opacity=".25"/>
      </svg>
      <ns-game-art [game]="id()" />
    </div>
    <div class="stage-caption"><strong>{{ theme()?.label }}</strong><span>{{ theme()?.caption }}</span></div>
  </div>
`,styles:[`
  :host{display:block;max-width:760px;margin:0 auto .5rem}
  .stage{overflow:hidden;border:1px solid color-mix(in srgb,var(--game-accent) 35%,var(--line));border-radius:22px;background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--game-accent) 17%,transparent),transparent 70%),#202020;box-shadow:0 7px 0 #0002}
  .scene{position:relative;height:90px;color:var(--game-accent)}svg{width:100%;height:100%;display:block}text{fill:currentColor;stroke:none;font:900 28px ui-monospace,monospace}[data-scene=human-exe] text{font-size:12px}
  ns-game-art{position:absolute;left:50%;top:10px;transform:translateX(-50%);width:125px;filter:drop-shadow(0 7px 8px #0003)}
  .stage-caption{text-align:center;padding:0 .75rem 1rem;display:grid;gap:.35rem}.stage-caption strong{font-size:.65rem;letter-spacing:.18em;color:var(--game-accent)}.stage-caption span{font-size:.8rem;color:var(--muted)}
  .left-prop,.right-prop{transform-box:fill-box;transform-origin:center;animation:prop-arrive .65s ease both}.right-prop{animation-delay:.1s}
  .revealed[data-scene=pick-number] ns-game-art{animation:dice-tumble .6s ease both}.revealed[data-scene=estimate] .liquid{animation:liquid-slosh .8s ease 2}.revealed[data-scene=restricted-clues] .right-prop{animation:vault-open .65s ease both}.revealed[data-scene=majority-rules] .left-prop,.revealed[data-scene=majority-rules] .right-prop{animation:poll-rise .7s ease both}.revealed[data-scene=one-of-us] .left-prop{animation:inspect .8s ease both}
  .scan{animation:scan-once 1.2s ease 2;opacity:.5}.revealed[data-scene=human-exe] .scan{animation:scan-once .5s ease 2}
  @keyframes prop-arrive{from{opacity:0;transform:translateY(8px)}to{opacity:.7;transform:translateY(0)}}
  @keyframes dice-tumble{0%{transform:translateX(-50%) rotate(-20deg) scale(.8)}60%{transform:translateX(-50%) rotate(12deg) scale(1.06)}100%{transform:translateX(-50%) rotate(0)}}
  @keyframes liquid-slosh{50%{transform:translateY(5px)}}@keyframes vault-open{50%{transform:rotate(-10deg) translateY(-5px)}}@keyframes poll-rise{from{transform:scaleY(.2)}to{transform:scaleY(1)}}@keyframes inspect{50%{transform:translateX(15px) rotate(8deg)}}@keyframes scan-once{from{transform:translateY(0)}to{transform:translateY(100px);opacity:0}}
  @media(max-width:480px){.scene{height:68px}ns-game-art{width:95px;top:3px}.stage-caption{padding:0 .5rem .5rem}.stage-caption span{display:none}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}.left-prop,.right-prop{opacity:.7}}
`]})
export class GameStageComponent {
  readonly room = input.required<RoomView>();
  readonly id = computed(()=>this.room().activeGame?.gameId ?? 'pick-number');
  readonly deck = computed(()=>(this.room().activeGame?.publicView as {deck?:string}|undefined)?.deck);
  readonly theme = computed(()=>this.id()==='estimate' ? ({
    earth:{label:'BLUE PLANET FIELD NOTES',caption:'From the surface to the deepest blue.'},
    mixed:{label:'THE CURIOSITY CABINET',caption:'One round in space. The next in the wild.'},
    wildlife:{label:'THE WILD GUESS',caption:'Big appetites. Small clues. Wild numbers.'},
    facts:{label:'A LITTLE SPACE TO WONDER',caption:'Small guesses in a very big universe.'}
  } as Record<string,{label:string;caption:string}>)[this.deck()??''] ?? themes['estimate'] : themes[this.id()]);
}
