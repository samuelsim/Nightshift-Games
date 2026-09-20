import { Component, computed, input } from '@angular/core';

import { quickTips, rules } from './game-guides';

@Component({selector:'ns-game-help',standalone:true,template:`
  @if (guide(); as guide) {
    <details #help class="game-help" (keydown.escape)="help.open = false">
      <summary>ⓘ How to play</summary>
      <div class="help-sheet"><h2>{{ guide.name }} · TL;DR</h2>
        <p class="quick-tip">{{ quickTip() }}</p><details><summary>Full rules &amp; scoring</summary><ol>@for (step of guide.steps; track step) { <li>{{ step }}</li> }</ol>
        <p><strong>Scoring:</strong> {{ guide.scoring }}</p></details>
        <small>Timer keeps running. Tap the heading or press Escape to close.</small>
      </div>
    </details>
  }
`,styles:[`
  :host{position:fixed;right:max(1rem,env(safe-area-inset-right));top:4.5rem;z-index:80}
  summary{list-style:none;cursor:pointer;width:max-content;margin-left:auto;border:1px solid var(--cyan);border-radius:99px;background:#202020;color:var(--text);padding:.6rem .85rem;font-size:.8rem;font-weight:800;box-shadow:0 3px 14px #0004}summary::-webkit-details-marker{display:none}
  .help-sheet{width:min(360px,calc(100vw - 3rem));max-height:calc(100dvh - 9rem);overflow:auto;padding:1.2rem;margin-top:.6rem;background:#242422;border:1px solid var(--line);border-radius:16px;box-shadow:0 15px 60px #0008}
  .quick-tip{font-size:1rem;color:var(--text)}.help-sheet summary{border:0;box-shadow:none;border-radius:6px;padding:.6rem 0;margin:0;background:transparent;font-size:.85rem}.help-sheet small{margin-top:.7rem}
  h2{font-size:1.1rem;margin:0 0 1rem}ol{padding-left:1.2rem;margin:0}li,p{font-size:.85rem;line-height:1.6}li+li{margin-top:.6rem}small{display:block;color:var(--muted);font-size:.75rem;line-height:1.5}
`]})
export class GameHelpComponent { readonly quickTip = computed(()=>quickTips[this.gameId()+(this.solo()?'-solo':'')] ?? quickTips[this.gameId()]); readonly gameId = input.required<string>(); readonly solo = input(false); readonly guide = computed(()=>rules[this.gameId()+(this.solo()?'-solo':'')] ?? rules[this.gameId()]); }
