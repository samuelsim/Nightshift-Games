import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { effectiveGameOptions, gameOptionFields, type GameOptions, type OptionValue } from '@nightshift/protocol/room';

@Component({selector:'ns-game-settings',standalone:true,imports:[FormsModule],template:`
  <details>
    <summary>Game settings <span>· {{ summary() }}</span></summary>
    <fieldset [disabled]="!isHost()">
      <legend class="visually-hidden">Game settings</legend>
      @for (field of fields(); track field.key) {
        <label>{{ field.label }}
          <select [ngModel]="values()[field.key]" (ngModelChange)="changeValue(field.key,$event)"
            [disabled]="gameId()==='estimate' && field.key==='rounds' && values()['daily']===true">
            @for (choice of field.choices; track choice.label) { <option [ngValue]="choice.value">{{ choice.label }}</option> }
          </select>
        </label>
      }
    </fieldset>
    @if (gameId()==='estimate') {
      <p>{{ values()['daily'] ? 'Daily challenges always use 5 rounds. Replays keep the same questions.' : '30 seconds per round. Mixed Trivia has the most variety.' }}</p>
    }
    @if (gameId()==='human-exe') { <p>Easy removes decoys. Standard includes them. Solo rounds last 15 seconds.</p> }
    <p>{{ isHost() ? 'Changing settings asks guests to ready again. Settings carry into next-game votes.' : 'The host chooses the settings.' }}</p>
  </details>
`,styles:[`
  :host{display:block;min-width:0}details{border:1px solid var(--line);border-radius:10px;padding:.3rem .75rem;background:var(--surface-strong)}
  summary{font-size:.9rem}summary span{font-weight:500;color:var(--muted)}
  fieldset{border:0;margin:0;padding:.5rem 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;min-width:0}
  label{display:grid;gap:.35rem;font-size:.85rem;color:var(--muted);font-weight:700}
  select{width:100%;min-width:0;min-height:44px;padding:.5rem;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);font-size:1rem}
  p{font-size:.8rem;line-height:1.45;color:var(--muted);margin:.5rem 0}select:disabled{opacity:.65}
  @media(max-width:440px){fieldset{grid-template-columns:minmax(0,1fr)}label{grid-template-columns:6.5rem minmax(0,1fr);align-items:center}}
`]})
export class GameSettingsComponent {
  changeValue(key:string,value:OptionValue):void { this.optionsChange.emit({[key]:value}); }
  readonly gameId=input.required<string>(); readonly options=input<GameOptions>({}); readonly isHost=input(false);
  readonly optionsChange=output<Record<string,OptionValue>>();
  readonly fields=computed(()=>gameOptionFields[this.gameId()] ?? []);
  readonly values=computed(()=>effectiveGameOptions(this.gameId(),this.options()));
  readonly summary=computed(()=>{
    const values=this.values();
    const parts=[`${values['rounds']} ${values['rounds']===1 ? 'round' : 'rounds'}`];
    if(values['daily']) parts.push('Daily');
    for(const key of ['deck','difficulty']) {
      const field=this.fields().find(field=>field.key===key);
      const label=field?.choices.find(choice=>choice.value===values[key])?.label;
      if(label) parts.push(label.split(' · ')[0]!);
    }
    return parts.join(' · ');
  });
}
