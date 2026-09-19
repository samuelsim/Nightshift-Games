import { Injectable, signal } from '@angular/core';
import type { RoomView } from '@nightshift/protocol';
import { emptyStats, isDailyMode, parseStats, recordRun, type StatsBook } from './personal-stats';

const storageKey = 'nightshift.personalStats.v1';
@Injectable({providedIn:'root'})
export class PersonalStatsService {
  readonly book = signal<StatsBook>(emptyStats());
  readonly storageAvailable = signal(true);
  readonly resultNote = signal('');
  constructor() {
    this.refresh();
    window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) this.refresh(); });
  }
  private refresh(): void {
    try { this.book.set(parseStats(localStorage.getItem(storageKey))); }
    catch { this.storageAvailable.set(false); }
  }
  observe(room: RoomView, playerId: string | null): void {
    if (room.phase !== 'SCOREBOARD') { this.resultNote.set(''); return; }
    const game = room.activeGame;
    if (!game?.runId || !playerId || !game.publicView || typeof game.publicView !== 'object') return;
    const scores = (game.publicView as {scores?:Record<string,number>}).scores;
    // Spectators with no scored participation do not acquire a record.
    if (!scores || !Object.hasOwn(scores,playerId)) return;
    if (this.storageAvailable()) this.refresh();
    const before = this.book();
    const run = {key:`${game.runId}:${playerId}`,gameId:game.gameId,mode:game.mode ?? '',score:scores[playerId]!};
    const next = recordRun(before,run);
    if (next === before) return;
    const old = before.records.find(row => row.gameId === run.gameId && row.mode === run.mode);
    this.book.set(next);
    try { localStorage.setItem(storageKey,JSON.stringify(next)); }
    catch { this.storageAvailable.set(false); }
    if (isDailyMode(run.mode)) {
      const record = next.records.find(row=>row.gameId===run.gameId && row.mode===run.mode)!;
      this.resultNote.set(`Daily ${!old ? 'first finish' : 'replay'} saved · First: ${record.first!.toLocaleString()} · Best: ${record.best.toLocaleString()} · ${record.played} completed`);
    } else this.resultNote.set(!old ? 'First finish recorded!' : run.score > old.best ? `New personal best! +${run.score-old.best} points` : `Personal best: ${old.best.toLocaleString()} points`);
  }
}
