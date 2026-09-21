import { Component, computed, input } from '@angular/core';
import type { EstimateArtSubject } from '@nightshift/games-estimate';
import { questionGlyph, questionLineColor } from './question-art-library';
const sphereRadii: Partial<Record<EstimateArtSubject, number>> = {earth:47,moon:47,jupiter:49,saturn:40,sun:45,mercury:40,neptune:44};

/** Decorative, schematic subjects: no counts, scales or answer-dependent geometry. */
@Component({
  selector: 'ns-question-art', standalone: true,
  template: `
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" focusable="false">
      @if (glyph()) {
        <ellipse cx="120" cy="136" rx="48" ry="4" fill="#9baeb4" opacity=".16"/>
      } @else {
      <g class="stars" stroke="#dfd7ad" stroke-width="2" stroke-linecap="round">
        <path d="M32 43h8m-4-4v8M196 105h8m-4-4v8M185 26h6m-3-3v6"/>
        <circle cx="53" cy="112" r="1"/><circle cx="213" cy="62" r="1"/>
      </g>
      }
      <g class="subject" [attr.data-motion]="glyph()?.motion" stroke="#302d39" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
        @if (glyph(); as drawing) {
          <path [attr.d]="drawing.shape" [attr.fill]="drawing.color"/>
          @if (drawing.accent; as accent) { <path [attr.d]="accent[1]" [attr.fill]="accent[0]"/> }
          <path [attr.d]="drawing.lines" [attr.stroke]="lineColor()"/>
        } @else {
        @switch (subject()) {
          @case ('sun') {
            <g class="rays" stroke="#f6bf66" stroke-width="4" stroke-linecap="round">
              <path d="M120 10v9m0 112v9M55 75h9m112 0h9M74 29l7 7m78 78l7 7M74 121l7-7m78-78l7-7"/>
            </g>
            <circle cx="120" cy="75" r="45" fill="#ffd276"/>
            <path d="M93 55q12-15 25-14M141 94q-7 12-19 13" stroke="#e59953" stroke-linecap="round"/>
            <path d="M88 80q-9-22 5-38" stroke="#fff0bd" stroke-linecap="round"/>
          }
          @case ('moon') {
            <circle cx="120" cy="75" r="47" fill="#e6e5dc"/>
            <path d="M146 37a47 47 0 0 1-37 84q54-21 37-84" fill="#b5b6b8" stroke="none"/>
            <g fill="#cacbc6" stroke="#a9abaa"><circle cx="102" cy="58" r="11"/><circle cx="135" cy="85" r="14"/><circle cx="101" cy="101" r="6"/><circle cx="136" cy="48" r="4"/></g>
          }
          @case ('earth') {
            <circle cx="120" cy="75" r="47" fill="#7bbfe6"/>
            <path d="M90 41l18-8 10 9-9 10 8 12-9 12-17-6-11-15M112 78l17 3 9 14-10 22-9-7-1-16-10-7M147 42l14 17-7 11-18-6 2-13" fill="#9cd0a1"/>
            <path d="M91 85h16m27-45h7m-1 58h11" stroke="#eaf8ec" stroke-width="4" stroke-linecap="round"/>
          }
          @case ('mercury') {
            <circle cx="120" cy="75" r="40" fill="#bbae9f"/>
            <g fill="#988f87" stroke="#807972"><circle cx="102" cy="63" r="9"/><circle cx="132" cy="92" r="12"/><circle cx="137" cy="54" r="5"/></g>
            <path d="M94 87l12 10m5-53 9-2" stroke="#e4d7c5" stroke-linecap="round"/>
          }
          @case ('venus') {
            <circle cx="120" cy="75" r="46" fill="#efd3a0"/>
            <path d="M87 50q27 17 58 0M77 72q40 22 86-2M88 96q35 17 65-2" stroke="#c99767" stroke-width="7" stroke-linecap="round"/>
            <path d="M97 38q22 12 42 3M97 110l20 4" stroke="#fff0c9" stroke-width="4" stroke-linecap="round"/>
          }
          @case ('mars') {
            <circle cx="120" cy="75" r="45" fill="#e69a7e"/>
            <path d="M103 35q17-10 34 1l-9 7-17-1Z" fill="#f7e8dc"/>
            <path d="M88 68l17-7 12 15 22 6 12-9M104 100l11-7 13 11" stroke="#b86859" stroke-width="6" stroke-linecap="round"/>
            <circle cx="140" cy="56" r="5" fill="#c77c65" stroke="none"/>
          }
          @case ('jupiter') {
            <circle cx="120" cy="75" r="49" fill="#e9c6a6"/>
            <path d="M82 45q35 13 75 0M73 70q47 14 94 0M79 96q45 10 82-2" stroke="#b98370" stroke-width="9"/>
            <path d="M88 111q31 4 61-1M76 58q47 14 87 0" stroke="#fff0cf" stroke-width="4"/>
            <ellipse cx="139" cy="88" rx="13" ry="7" fill="#c47461"/>
          }
          @case ('saturn') {
            <ellipse cx="120" cy="75" rx="83" ry="23" transform="rotate(-18 120 75)" fill="#c6b6a0"/>
            <circle cx="120" cy="75" r="40" fill="#e5d4a9"/>
            <path d="M87 54q32 9 65 0M82 73q39 9 76 0" stroke="#c7b58c" stroke-width="5"/>
            <path d="M43 95q15 22 85 0t70-43l3 15q-6 22-71 43T43 95" fill="#dfcfb0"/>
          }
          @case ('uranus') {
            <circle cx="120" cy="75" r="44" fill="#a6d9d9"/>
            <path d="M91 48q-16 31 1 55" stroke="#d9f4e9" stroke-width="5" stroke-linecap="round"/>
            <path d="M148 48q14 26 0 53" stroke="#7fbec6" stroke-width="7" stroke-linecap="round"/>
          }
          @case ('neptune') {
            <circle cx="120" cy="75" r="44" fill="#759ae0"/>
            <path d="M85 52q32 10 64 0M80 76q39 10 80 0M90 101q31 7 58-2" stroke="#577cc0" stroke-width="5"/>
            <path d="M98 61h19m12 28h17" stroke="#bddef7" stroke-width="3" stroke-linecap="round"/>
          }
        }
        }
        @if (measure()) {
          <path [attr.d]="guidePath()" stroke="#302d39" stroke-width="6"/>
          <path [attr.d]="guidePath()" stroke="#fff5d8" stroke-width="2.5"/>
        }
      </g>
    </svg>
  `,
  styles: [`
    :host{display:block;width:100%;height:100%;pointer-events:none}
    svg{display:block;width:100%;height:100%}
    .subject{transform-origin:120px 75px;animation:subject-arrive 1.1s ease-out both}
    .subject[data-motion=float]{animation:float-arrive 1.4s ease-out both}
    .subject[data-motion=roll]{animation:roll-arrive 1.2s ease-out both}
    .subject[data-motion=sway]{animation:sway-arrive 1.4s ease-out both}
    .stars{animation:star-arrive 1.4s ease-out both}
    .rays{transform-origin:120px 75px;animation:sun-arrive 1.5s ease-out both}
    @keyframes subject-arrive{from{transform:translateY(5px) rotate(-4deg);opacity:.25}to{transform:none;opacity:1}}
    @keyframes star-arrive{from{opacity:0}to{opacity:.7}}
    @keyframes sun-arrive{from{transform:rotate(-12deg)}to{transform:none}}
    @keyframes float-arrive{0%{transform:translateY(8px);opacity:.25}60%{transform:translateY(-3px);opacity:1}100%{transform:none}}
    @keyframes roll-arrive{from{transform:translateX(-8px) rotate(-9deg);opacity:.25}to{transform:none;opacity:1}}
    @keyframes sway-arrive{0%{transform:rotate(-4deg);opacity:.25}55%{transform:rotate(3deg);opacity:1}100%{transform:none}}
    @media(prefers-reduced-motion:reduce){.subject,.stars,.rays{animation:none!important}}
  `]
})
export class QuestionArtComponent {
  readonly subject = input.required<EstimateArtSubject>();
  readonly measure = input<'radius' | 'diameter' | undefined>();
  readonly guidePath = computed(() => {
    const radius = sphereRadii[this.subject()] ?? 45;
    const start = this.measure() === 'diameter' ? 120 - radius : 120;
    return `M${start} 75H${120 + radius}M${start} 71V79M${120 + radius} 71V79`;
  });
  readonly glyph = computed(() => questionGlyph(this.subject()));
  readonly lineColor = computed(() => questionLineColor(this.subject()));
}
