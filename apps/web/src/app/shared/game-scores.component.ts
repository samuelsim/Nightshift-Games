import { Component, computed, input } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { gameStyles } from '../games/game-styles';

@Component({ selector: 'ns-game-scores', standalone: true, styles: [gameStyles], template: `
  <section><h2>Scores</h2>
    @for (entry of entries(); track entry.id) {
      <div class="row"><span>{{ entry.name }}</span><b>{{ entry.score }}</b></div>
    }
  </section>
` })
export class GameScoresComponent {
  readonly room = input.required<RoomView>();
  readonly scores = input.required<Readonly<Record<string, number>>>();
  readonly entries = computed(() => [...new Set([...this.room().players.map(p => p.id), ...Object.keys(this.scores())])]
    .map(id => ({ id, name: this.room().players.find(p => p.id === id)?.nickname ?? 'Departed player', score: this.scores()[id] ?? 0 }))
    .sort((a,b) => b.score - a.score));
}
