import { Component, computed, input } from '@angular/core';
import type { PickNumberPublicView } from '@nightshift/games-pick-number';
import { pickArtState } from './pick-art-state';

@Component({selector:'ns-pick-art',standalone:true,template:`
  @for (key of keys(); track key) {
    <svg viewBox="0 0 300 150" fill="none" aria-hidden="true" focusable="false" [attr.data-mode]="scene().mode">
      <ellipse cx="150" cy="138" rx="81" ry="4" fill="#b8c7c7" opacity=".13"/>
      <g class="console" stroke="#302d39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M84 37H215L229 121Q151 139 70 121Z" fill="#b6cdd2"/>
        <path d="M90 49H210L216 103H83Z" fill="#354451"/>
        <path d="M105 29V15H119M188 29V15H174" stroke="#d3e1db"/>
        <path d="M116 119H151" stroke="#e8dcac"/>
        <circle cx="186" cy="118" r="5" fill="#e6b68c"/>
        <text x="150" y="89" text-anchor="middle" fill="#eef2db" stroke="none">{{ scene().display }}</text>
        @if (scene().mode === 'higher' || scene().mode === 'lower') {
          <g class="arrow" [class.down]="scene().mode === 'lower'" stroke="#eed29b" stroke-width="5">
            <path d="M253 92V51M240 65l13-14 13 14"/>
          </g>
        } @else if (scene().mode === 'found') {
          <path class="spark" d="M41 43v16m-8-8h16M255 97v14m-7-7h14" stroke="#e6d39b"/>
          <path d="M239 55l8 8 18-22" stroke="#acd7ae" stroke-width="5"/>
        } @else if (scene().mode === 'reveal') {
          <path class="spark" d="M41 43v16m-8-8h16M255 97v14m-7-7h14" stroke="#e6d39b"/>
        } @else if (scene().mode === 'locked') {
          <path d="M244 62V49q12-20 24 0V62M239 62h34v30h-34Z" fill="#e8c88e"/>
        } @else if (scene().mode === 'miss') {
          <path d="M243 62h24" stroke="#e2baad" stroke-width="5"/>
        } @else {
          <g class="scan" stroke="#b2dbcd" opacity=".8"><circle cx="47" cy="80" r="22"/><path d="M47 80L57 62"/></g>
        }
      </g>
    </svg>
  }
`,styles:[`
  :host,svg{display:block;width:100%;height:100%;pointer-events:none}text{font:800 39px ui-monospace,monospace}
  .console{transform-origin:150px 125px;animation:arrive .55s ease-out both}
  .arrow{animation:hint .7s ease-out both;transform-origin:253px 72px}.arrow.down{rotate:180deg}
  .scan{transform-origin:47px 80px;animation:scan 1.3s ease-out both}.spark{animation:spark .8s ease-out both}
  [data-mode=found] .console{animation:found .65s ease-out both}
  @keyframes arrive{from{transform:translateY(5px);opacity:.4}to{transform:none;opacity:1}}
  @keyframes hint{from{transform:translateY(8px);opacity:.2}to{transform:none;opacity:1}}
  @keyframes scan{from{transform:rotate(-70deg);opacity:.2}to{transform:none;opacity:.8}}
  @keyframes spark{from{opacity:0}to{opacity:1}}
  @keyframes found{0%{transform:scale(.94)}55%{transform:scale(1.04)}100%{transform:none}}
  @media(prefers-reduced-motion:reduce){*{animation:none!important}}
`]})
export class PickArtComponent {
  readonly view = input.required<PickNumberPublicView>();
  readonly scene = computed(() => pickArtState(this.view()));
  readonly keys = computed(() => [`${this.view().round}:${this.view().phase}:${this.view().solo?.attempts.length ?? this.view().submittedPlayerIds.length}`]);
}
