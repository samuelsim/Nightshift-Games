import { Component, input } from '@angular/core';

@Component({
  selector: 'ns-game-art', standalone: true,
  template: `
    <svg viewBox="0 0 240 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <ellipse cx="120" cy="132" rx="72" ry="8" fill="#252525" opacity=".12"/>
      <g stroke="#29272a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="art-character">
        @switch (game()) {
          @case ('human-infiltrator') {
            <path d="M70 40H170V117Q120 143 70 117Z" fill="#e7e2ff"/>
            <path d="M80 34Q120 3 160 34L175 45H65Z" fill="#424057"/>
            <rect x="83" y="58" width="74" height="30" rx="12" fill="#424057"/>
            <circle cx="103" cy="73" r="5" fill="#aaf5e4"/><circle cx="137" cy="73" r="5" fill="#aaf5e4"/>
            <path d="M109 104H132M95 117L106 128M146 117L135 128M61 77H48V96H61M179 77H192V96H179"/>
            <path d="M28 40L35 33M202 41L211 32M28 115H40M204 111H215" stroke="#7565bd"/>
          }
          @case ('estimate') {
            <path d="M72 36Q120 27 166 36L175 119Q124 140 66 119Z" fill="#fff5d8"/>
            <path d="M72 36Q117 53 166 36M70 67Q120 80 170 66"/>
            <path d="M89 83L87 99M109 88L108 104M130 88L130 104M151 83L153 99" stroke="#ec947a"/>
            <path d="M86 30Q78 3 105 17M145 29Q162 6 167 23"/>
            <circle cx="104" cy="59" r="3" fill="#29272a"/><circle cx="138" cy="59" r="3" fill="#29272a"/>
            <path d="M116 60Q121 66 126 60"/>
            <path d="M46 68L38 60M190 50L200 44M191 92L202 96"/>
          }
          @case ('restricted-clues') {
            <path d="M58 41Q58 27 75 27H165Q183 27 183 44V92Q183 106 166 106H106L83 123V106H75Q58 106 58 90Z" fill="#f5fff3"/>
            <circle cx="100" cy="57" r="4" fill="#29272a"/><circle cx="142" cy="57" r="4" fill="#29272a"/>
            <path d="M99 81H145" stroke-width="9"/>
            <path d="M131 115L128 85Q127 76 135 77Q141 78 141 86L146 105Q166 93 172 108L167 128" fill="#ffca8c"/>
            <path d="M40 39L31 34M198 59L209 58M43 89L35 96"/>
          }
          @case ('human-exe') {
            <path d="M117 30V16M109 15H125"/>
            <rect x="66" y="33" width="110" height="87" rx="20" fill="#e5f8ff"/>
            <path d="M66 68H54V91H66M176 68H187V91H176" fill="#ffcf65"/>
            <rect x="80" y="48" width="81" height="43" rx="13" fill="#29272a"/>
            <path d="M93 66L99 72L105 66M135 66L141 72L147 66" stroke="#9eebc9"/>
            <path d="M107 104H133M90 121L82 133M150 121L158 133"/>
            <path d="M193 28V40M187 34H199" stroke="#fff5d8"/>
          }
          @case ('majority-rules') {
            <path d="M37 115V84Q37 62 60 62Q83 62 83 84V115" fill="#fff5d8"/>
            <path d="M157 115V84Q157 62 180 62Q203 62 203 84V115" fill="#fff5d8"/>
            <path d="M82 125V72Q82 43 120 43Q158 43 158 72V125" fill="#c5a4ff"/>
            <path d="M103 82V88M136 82V88M110 101Q121 112 132 101M53 85V88M68 85V88M172 85V88M188 85V88"/>
            <path d="M105 32L97 16M122 29V10M139 33L150 18"/>
          }
          @case ('one-of-us') {
            <path d="M70 125V77Q70 32 120 32Q170 32 170 77V125L151 116L137 129L119 119L99 130L84 117Z" fill="#fff6df"/>
            <path d="M83 61Q120 78 156 59L151 86Q120 98 88 86Z" fill="#29272a"/>
            <path d="M99 77L109 79M133 79L143 75" stroke="#fff6df"/>
            <path d="M118 107Q125 99 132 104M43 49Q37 35 48 31Q61 29 59 40L52 48M51 58V59"/>
            <path d="M190 83L203 78M188 99L203 104"/>
          }
          @default {
            <g transform="rotate(-9 120 78)">
              <rect x="73" y="27" width="97" height="99" rx="22" fill="#fff5d8"/>
              <circle cx="95" cy="50" r="5" fill="#29272a"/><circle cx="147" cy="50" r="5" fill="#29272a"/>
              <circle cx="95" cy="102" r="5" fill="#29272a"/><circle cx="147" cy="102" r="5" fill="#29272a"/>
              <path d="M108 77Q121 94 134 77"/>
            </g>
            <path d="M46 54L37 43M190 42L200 33M190 110L203 116"/>
          }
        }
      </g>
    </svg>
  `,
  styles: [`:host{display:block;line-height:0}svg{display:block;width:100%;height:100%;overflow:visible}.art-character{transform-origin:120px 125px;transition:transform .3s ease}:host:hover .art-character{transform:rotate(4deg) translateY(-4px)}@media(prefers-reduced-motion:reduce){.art-character{transition:none!important;transform:none!important}}`]
})
export class GameArtComponent { readonly game = input('pick-number'); }
