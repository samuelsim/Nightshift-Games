import { Component, computed, input } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { useClock } from './clock';

@Component({selector:'ns-host-status',standalone:true,template:`
  @if (host(); as host) {
    @if (!host.connected) {
      <aside role="status"><b>{{ host.nickname }} lost connection.</b>
        <span>{{ seconds() > 0 ? 'Host control transfers in ' + seconds() + 's if they do not return.' : 'Choosing the next connected host…' }}</span>
        <small>Their player seat stays reserved for up to two minutes.</small>
      </aside>
    } @else { <p class="host-label">Host: <b>{{ host.nickname }}</b></p> }
  }
`,styles:[`:host{display:block}aside{display:grid;gap:.4rem;border:1px solid var(--gold);border-radius:12px;padding:1rem;background:var(--surface);overflow-wrap:anywhere}aside span,small,.host-label{color:var(--muted);font-size:.8rem}.host-label{margin:.5rem 0;overflow-wrap:anywhere}b{color:var(--text)}@media(max-width:600px){.host-label{padding-right:130px;min-height:44px}aside{margin-top:3rem}}`]})
export class HostStatusComponent {
  readonly room = input.required<RoomView>();
  private readonly now = useClock();
  readonly host = computed(() => this.room().players.find(player => player.id === this.room().hostPlayerId));
  readonly seconds = computed(() => Math.max(0,Math.ceil(((this.host()?.lastSeenAt ?? 0)+10_000-this.now())/1000)));
}
