import { Component, input } from '@angular/core';

@Component({
  selector: 'ns-avatar-art', standalone: true,
  template: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" fill="var(--avatar-color, #8ef5c3)" stroke="#252329" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      @switch (avatar()) {
        @case ('spark') { <path d="M32 7L38 23L55 19L45 33L54 47L37 43L29 57L25 40L8 37L22 27L18 11Z"/><path d="M28 30V32M37 29V31M29 38Q34 42 38 36" fill="none"/> }
        @case ('radar') { <circle cx="32" cy="33" r="23"/><circle cx="32" cy="33" r="15" fill="none" opacity=".4"/><path d="M32 33L46 17M26 34V36M38 34V36M28 42Q32 46 37 41" fill="none"/><circle cx="44" cy="21" r="4" fill="#fff6df"/> }
        @case ('bean') { <path d="M45 10C28 1 13 19 12 35C10 55 31 60 43 51C54 42 39 37 40 29C41 21 56 18 45 10Z"/><path d="M24 30V33M33 27V30M25 40Q30 44 34 37" fill="none"/> }
        @case ('bolt') { <path d="M35 5L12 35H28L24 59L53 25H36L43 5Z"/><path d="M28 25V27M36 25V27M29 32Q33 35 36 31" fill="none"/> }
        @case ('mug') { <path d="M45 25H51C63 25 59 44 45 43" fill="none"/><path d="M13 22H46V43Q46 55 30 55Q13 55 13 43Z"/><path d="M22 34V36M36 34V36M24 43Q29 48 35 42M23 15Q18 11 24 7M35 15Q30 11 36 7" fill="none"/> }
        @default { <path d="M42 9C21 4 7 21 12 39C17 58 44 60 54 39C37 46 24 26 42 9Z"/><path d="M21 32V34M31 40L33 41M20 42Q20 47 26 47" fill="none"/><path d="M49 12V20M45 16H53" fill="none" stroke="var(--avatar-color, #8ef5c3)"/> }
      }
    </svg>
  `,
  styles: [`:host{display:block;width:100%;max-width:58px;line-height:0}svg{display:block;width:100%;height:auto}`]
})
export class AvatarArtComponent { readonly avatar = input('moon'); }
