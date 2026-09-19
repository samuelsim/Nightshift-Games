import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { PersonalStatsService } from '../services/personal-stats.service';
import { isDailyMode, recordModeLabel } from '../services/personal-stats';
import { gameCatalog } from '@nightshift/games-registry/catalog';

@Component({selector:'ns-personal-stats',standalone:true,imports:[DecimalPipe,TitleCasePipe],template:`
  <section class="record-shelf">
    <span class="eyebrow">YOUR NIGHTSHIFT RECORD</span><h2>A little better every break.</h2>
    <p>Personal bests and finished games, saved in this browser. Solo, multiplayer and mixed sessions have separate records.</p>
    @if (!stats.storageAvailable()) { <p role="status">Storage is unavailable. Records last for this visit only.</p> }
    @if (!stats.book().records.length) { <div class="empty-record">☆<span>Your first finish starts the collection.<small>Reach final scores in any game to save a record.</small></span></div> }
    <div class="record-grid">@for (record of regularRecords(); track record.gameId + record.mode) {
      <article><small>{{ modeLabel(record.mode) | titlecase }}{{ record.gameId === 'estimate' && !record.mode.startsWith('estimate:') ? ' · Legacy quantities' : '' }}</small><h3>{{ name(record.gameId) }}</h3><strong>{{ record.best | number }}<small>BEST SCORE</small></strong><p>{{ record.played | number }} finished · {{ record.total | number }} total points</p></article>
    }</div>
    @if (dailyRecords().length) {
      <h2>★ Your daily challenge log</h2>
      <p>First completed score, replay best and finishes for each UTC date. Abandoned runs are not counted. Personal records, shared by this browser profile.</p>
      <div class="record-grid">@for (record of visibleDaily(); track record.gameId + record.mode) {
        <article><small>{{ modeLabel(record.mode) | titlecase }}</small><h3>Daily Estimate</h3>
          <strong>{{ record.best | number }}<small>DAILY BEST</small></strong>
          <p>First finish: {{ record.first | number }} · {{ record.played | number }} completed</p>
        </article>
      }</div>
      @if (dailyRecords().length > 12) { <button type="button" (click)="showAllDaily.set(!showAllDaily())">{{ showAllDaily() ? 'Show recent challenges' : 'Show saved daily history' }}</button> }
      <p><small>The latest 180 daily records are retained. No public leaderboard or cross-device sync.</small></p>
    }
    <small>Shared by players using this browser profile. Clearing site data clears records. No account or cloud sync.</small>
  </section>
`,styles:[`
  :host{display:block;grid-column:1/-1;width:100%;max-width:1100px}.record-shelf{padding:1.4rem;border:1px solid var(--line);border-radius:18px;background:var(--surface)}.eyebrow{font-size:.65rem;color:var(--gold);letter-spacing:.12em;font-weight:900}h2{margin:.6rem 0}p,small{color:var(--muted);line-height:1.5}.record-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.8rem;margin:1rem 0}article{padding:1rem;border:1px solid var(--line);border-radius:12px;background:var(--surface-strong)}h3{margin:.4rem 0 1rem}strong{font-size:2rem;color:var(--gold)}strong small{display:block;font-size:.55rem;letter-spacing:.12em}.empty-record{display:flex;align-items:center;gap:1rem;padding:1rem;color:var(--gold);font-size:2rem}.empty-record span{font-size:.95rem}.empty-record small{display:block;font-size:.8rem}
`]})
export class PersonalStatsComponent {
  readonly modeLabel = recordModeLabel;
  readonly stats = inject(PersonalStatsService);
  readonly showAllDaily = signal(false);
  readonly regularRecords = computed(()=>this.stats.book().records.filter(row=>!isDailyMode(row.mode)));
  readonly dailyRecords = computed(()=>this.stats.book().records.filter(row=>isDailyMode(row.mode)).slice().reverse());
  readonly visibleDaily = computed(()=>this.showAllDaily()?this.dailyRecords():this.dailyRecords().slice(0,12));
  name(id:string):string { return gameCatalog.find(game => game.id === id)?.name ?? id; }
}
