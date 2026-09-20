import { Component, computed, inject, input, output } from '@angular/core';
import { PersonalStatsService } from '../services/personal-stats.service';
import type { RoomView } from '@nightshift/protocol';
import { effectiveGameOptions, estimateDeckLabels } from '@nightshift/protocol/room';
import { useClock } from './clock';
import { gameStyles } from '../games/game-styles';

@Component({ selector: 'ns-next-game', standalone: true, styles: [gameStyles, ':host { display:block; margin: 1rem auto; max-width: 760px; } .vote-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.5rem; margin:.75rem 0; } .vote-grid button { font-size:.85rem; overflow-wrap:anywhere; } .vote-grid small { display:block; }'],
  template: `
    <section>
      @if (room().phase === 'SCOREBOARD') {
        @if (stats.resultNote()) { <p class="personal-record" role="status">☆ {{ stats.resultNote() }}</p> }
        @if (!stats.storageAvailable()) { <p>Records last for this visit only because browser storage is unavailable.</p> }
        <div class="shift-finale">
          <svg viewBox="0 0 120 100" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M38 17H82V43Q82 63 60 67Q38 63 38 43Z" fill="currentColor" fill-opacity=".15"/><path d="M38 24H23V37Q23 52 42 51M82 24H97V37Q97 52 78 51M60 67V80M43 87H77M49 80H71"/><path d="M60 28L64 37L74 38L67 45L69 55L60 50L51 55L53 45L46 38L56 37Z"/><path d="M17 13L22 18M101 12L96 17M10 63L19 61M108 63L100 61"/></svg>
          <div><small>THAT'S A SHIFT</small><h2>{{ finaleTitle() }}</h2><p>{{ finaleDetail() }}</p></div>
        </div>
      }
      <details [open]="room().phase === 'SCOREBOARD'"><summary>{{ room().phase === 'SCOREBOARD' ? 'Up next · voting closes in ' + seconds() + 's' : 'Vote for the next game' + (myVoteName() ? ' · ' + myVoteName() : '') }}</summary>
      <p>Most votes wins. Ties are random; no votes picks a fresh game.</p><div class="vote-grid">
      @for (game of room().games; track game.id) {
        <button [disabled]="!eligible(game.minPlayers, game.maxPlayers)" [class.selected]="room().nextGameVotes[playerId() ?? ''] === game.id"
          [attr.aria-pressed]="room().nextGameVotes[playerId() ?? ''] === game.id" (click)="vote.emit(game.id)">
          {{ game.name }} · {{ count(game.id) }} {{ count(game.id) === 1 ? 'vote' : 'votes' }} {{ room().nextGameVotes[playerId() ?? ''] === game.id ? '· Your vote' : '' }}
          <small>{{ roundsFor(game.id) }} rounds</small>
          @if (game.id === 'human-exe') { <small>{{ optionsFor(game.id)['difficulty'] }} difficulty</small> }
          @if (game.id === 'estimate') { <small> · {{ room().estimateOptions?.daily ? 'Daily / ' : '' }}{{ deckLabels[room().estimateOptions?.deck || 'generated'] }} / {{ room().estimateOptions?.difficulty || 'standard' }}</small> }
          @if (!eligible(game.minPlayers, game.maxPlayers)) { <small> · Needs {{ game.minPlayers }}–{{ game.maxPlayers }} players</small> }
        </button>
      }
      </div></details>
      @if (isHost()) { <button (click)="returnToLobby.emit()">{{ room().phase === 'SCOREBOARD' ? 'Stop rotation · back to lobby' : 'End game · back to lobby' }}</button> }
    </section>
  ` })
export class NextGameComponent {
  readonly myVoteName = computed(() => this.room().games.find(game => game.id === this.room().nextGameVotes[this.playerId() ?? ''])?.name);
  optionsFor(id:string) { return effectiveGameOptions(id,this.room().gameOptions?.[id]); }
  roundsFor(id:string):number { return Number(this.optionsFor(id)['rounds']); }
  readonly deckLabels = estimateDeckLabels;
  readonly stats = inject(PersonalStatsService);
  readonly room = input.required<RoomView>(); readonly playerId = input.required<string | null>(); readonly isHost = input.required<boolean>();
  readonly vote = output<string>(); readonly returnToLobby = output<void>(); private readonly now = useClock();
  readonly seconds = computed(() => Math.max(0, Math.ceil((this.room().nextGameStartsAt - this.now()) / 1000)));
  private readonly leaders = computed(() => {
    const players = this.room().players;
    const high = Math.max(0, ...players.map(p => p.score));
    return players.filter(p => p.score === high);
  });
  readonly finaleTitle = computed(() => {
    if (this.room().players.length === 1) return 'Solo run complete';
    if (!this.leaders()[0]?.score) return 'Shift complete';
    return this.leaders().length > 1 ? 'A shared victory' : 'Top of the night';
  });
  readonly finaleDetail = computed(() => {
    const leaders = this.leaders();
    return leaders.length
      ? `${leaders.map(p => p.nickname).join(' & ')} · ${leaders[0]!.score.toLocaleString()} points`
      : 'Your next game is on its way.';
  });
  eligible(min: number, max: number): boolean { const n = this.room().players.filter(p => p.connected).length; return n >= min && n <= max; }
  count(id: string): number { return this.room().players.filter(p => p.connected && this.room().nextGameVotes[p.id] === id).length; }
}
