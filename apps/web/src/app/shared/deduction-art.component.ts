import { Component, input } from '@angular/core';
import type { DeductionArt } from './deduction-art-state';

@Component({selector:'ns-deduction-art',standalone:true,template:`
  @for (key of [scene().key]; track key) {
    <svg viewBox="0 0 320 150" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round"
      [attr.data-mode]="scene().mode" [attr.data-outcome]="scene().outcome">
      <ellipse cx="160" cy="139" rx="99" ry="5" fill="#10191e" stroke="none" opacity=".45"/>
      @switch (scene().game) {
        @case ('restricted-clues') {
          <path d="M66 40H25V76H45L59 89V76H66M255 49H295V83H280L266 96V83H255" fill="#48636b" stroke="#a5d9d2"/>
          <path class="whisper" d="M35 53H53M35 63H48M277 61H286M277 71H286" stroke="#c6e6de"/>
          <rect x="81" y="15" width="158" height="119" rx="16" fill="#455962" stroke="#a9bfc7"/>
          <rect x="94" y="27" width="132" height="96" rx="9" fill="#162e39" stroke="#243d46"/>
          @if (scene().mode === 'reveal' || scene().mode === 'results') {
            <g class="paper"><path d="M130 43H178L190 55V105H130Z" fill="#f3dfac" stroke="#cdb783"/><path d="M178 43V55H190M140 70H176M140 81H179M140 92H166" stroke="#596976"/></g>
          }
          <g class="vault-door">
            <rect x="97" y="29" width="126" height="92" rx="8" fill="#718992" stroke="#cee0df"/>
            <circle cx="160" cy="74" r="25" fill="#344d59" stroke="#e9cd87"/>
            <g class="dial"><path d="M160 55V93M141 74H179M147 61L173 87M147 87L173 61" stroke="#e9cd87" stroke-width="4"/><circle cx="160" cy="74" r="7" fill="#e9cd87" stroke="#e9cd87"/></g>
            <path d="M108 47V64M108 89V104" stroke="#344d59" stroke-width="5"/>
          </g>
        }
        @case ('one-of-us') {
          <rect x="75" y="17" width="170" height="116" rx="9" fill="#594541" stroke="#c69979"/>
          <path d="M108 48L206 83L116 109L186 44" stroke="#d7937d" opacity=".7"/>
          <g class="notes"><path d="M89 31L132 27L137 67L94 71ZM181 33L223 40L217 79L175 73ZM95 90L144 84L148 120L99 126Z" fill="#e7d7b5" stroke="#c5ae86"/><path d="M101 45L123 43M103 54L122 52M188 49L210 53M187 58L205 61M108 100L133 97M109 110L126 108" stroke="#657278"/></g>
          @if (scene().mode === 'collect') {
            <g class="envelope"><rect x="129" y="72" width="71" height="47" rx="5" fill="#a2c2c1" stroke="#d3e6d9"/><path d="M131 75L164 100L198 75M131 116L150 96M198 116L178 96" stroke="#416778"/></g>
          } @else if (scene().mode === 'vote') {
            <g class="ballot"><path d="M150 66H213V127H150Z" fill="#647b8a" stroke="#c6d8d6"/><path d="M163 78H199" stroke="#273f50" stroke-width="5"/><path d="M165 31H195V73H165Z" fill="#f3dfac" stroke="#d1b981"/><path d="M171 51L178 58L189 44" stroke="#526875"/></g>
          } @else {
            <g class="lens"><circle cx="180" cy="84" r="29" fill="#91bdbe" fill-opacity=".2" stroke="#e8c87f" stroke-width="7"/><path d="M201 107L221 128" stroke="#e8c87f" stroke-width="10"/><path d="M164 76Q180 61 196 76Q180 93 164 76Z" fill="#c9ddcc" stroke="#416674"/><circle cx="180" cy="76" r="5" fill="#314856" stroke="none"/></g>
          }
        }
        @case ('human-infiltrator') {
          <path d="M88 112L73 134H247L232 112" fill="#738c96" stroke="#bcd4d7"/>
          <rect x="85" y="20" width="150" height="96" rx="12" fill="#526c79" stroke="#bbd6da"/>
          <rect x="96" y="31" width="128" height="73" rx="6" fill="#172e40" stroke="#324d62"/>
          <path d="M145 123H175" stroke="#d9ce9f"/>
          @if (scene().mode === 'collect') {
            <path class="signal" d="M110 70H123L130 51L140 88L151 59L161 70H178M191 57V83M182 70H200" stroke="#9ed8c6" stroke-width="3"/>
          } @else if (scene().mode === 'discuss') {
            <g class="notes"><rect x="108" y="42" width="27" height="48" rx="4" fill="#7eacb6"/><rect x="147" y="42" width="27" height="48" rx="4" fill="#7eacb6"/><rect x="186" y="42" width="27" height="48" rx="4" fill="#7eacb6"/><path d="M115 55H128M115 65H128M154 55H167M154 65H167M193 55H206M193 65H206" stroke="#253f54"/></g>
          } @else if (scene().mode === 'vote') {
            <circle cx="160" cy="68" r="29" stroke="#8bd6c7"/><circle cx="160" cy="68" r="17" stroke="#477f82"/><path class="radar" d="M160 68L160 39" stroke="#e7dc9e" stroke-width="3"/><circle cx="173" cy="56" r="3" fill="#b5e3d5" stroke="none"/>
          } @else {
            <g class="identity"><rect x="139" y="49" width="42" height="37" rx="7" fill="#b5c7bc" stroke="#e0e8ca"/><path d="M160 40V49M132 60H139M181 60H188M149 77H171" stroke="#e0e8ca"/><circle cx="150" cy="62" r="3" fill="#344d60" stroke="none"/><circle cx="170" cy="62" r="3" fill="#344d60" stroke="none"/></g>
          }
          <path class="signal" d="M61 50Q45 68 61 86M48 39Q22 68 48 97M259 50Q275 68 259 86M272 39Q298 68 272 97" stroke="#85bfc2"/>
        }
      }
      @if (scene().mode === 'reveal' || scene().mode === 'results') {
        <g class="seal" transform="translate(248 111)">
          <circle r="19" fill="#243b49" stroke="#e7ce91"/>
          @if (scene().outcome === 'caught' || scene().mode === 'results') {
            <path d="M-9 0L-2 7L10 -7" stroke="#b7dfca" stroke-width="3"/>
          } @else if (scene().outcome === 'escaped') {
            <path d="M-10 0H10M3 -7L10 0L3 7" stroke="#e7ce91" stroke-width="3"/>
          } @else if (scene().outcome === 'void') {
            <path d="M-6 -7V7M6 -7V7" stroke="#c7d1d4" stroke-width="3"/>
          } @else {
            <path d="M-8 4V-4Q0 -12 8 -4V4M-10 4H10V12H-10Z" stroke="#e7ce91"/>
          }
        </g>
      }
    </svg>
  }
`,styles:[`
  :host{display:block;height:100%;width:100%}svg{display:block;width:100%;height:100%;stroke-width:2;animation:arrive .5s ease-out both}
  .dial{transform-origin:160px 74px;animation:turn .85s ease-out both}.whisper,.signal{animation:pulse 1.2s ease-out both}
  .notes,.envelope,.paper{animation:arrive .6s ease-out both}.lens{animation:inspect 1s ease-out both}.radar{transform-origin:160px 68px;animation:sweep 1.2s ease-out both}.ballot{animation:drop .65s ease-out both}.seal{animation:stamp .5s ease-out both;transform-box:fill-box;transform-origin:center}
  [data-mode=reveal] .vault-door,[data-mode=results] .vault-door{transform-origin:97px 74px;animation:open .8s ease-out both}
  [data-outcome=escaped] .identity{animation:fade .9s ease-out both}
  @keyframes arrive{from{opacity:0;translate:0 5px}to{opacity:1;translate:0 0}}@keyframes turn{from{rotate:-70deg}to{rotate:0deg}}@keyframes pulse{0%,60%{opacity:.3}30%,100%{opacity:1}}@keyframes inspect{0%{translate:-12px 0}55%{translate:7px 0}100%{translate:0 0}}@keyframes sweep{from{rotate:-100deg}to{rotate:30deg}}@keyframes drop{from{translate:0 -10px}to{translate:0 0}}@keyframes stamp{from{scale:1.3;opacity:0}to{scale:1;opacity:1}}@keyframes open{from{scale:1 1}to{scale:.12 1}}@keyframes fade{to{opacity:.45}}
  @media(prefers-reduced-motion:reduce){svg,svg *{animation:none!important}[data-mode=reveal] .vault-door,[data-mode=results] .vault-door{scale:.12 1}[data-outcome=escaped] .identity{opacity:.45}}
`]})
export class DeductionArtComponent { readonly scene = input.required<DeductionArt>(); }
