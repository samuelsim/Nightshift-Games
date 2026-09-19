import { estimateDeckLabels, type EstimateDeck } from '@nightshift/protocol/room';
export interface GameRecord { gameId: string; mode: string; played: number; best: number; total: number; first?: number; }
export interface StatsBook { version: 1; records: GameRecord[]; seen: string[]; }
export interface FinishedRun { key: string; gameId: string; mode: string; score: number; }
export const emptyStats = (): StatsBook => ({version:1,records:[],seen:[]});
export const isDailyMode = (mode: string): boolean => typeof mode === 'string' && mode.startsWith('daily:');
export function validRecordMode(mode: string): boolean {
  if (typeof mode !== 'string') return false;
  if (['solo','multiplayer','mixed'].includes(mode) || /^estimate:(generated|facts|earth|wildlife|mixed):(easy|standard|hard):(solo|multiplayer|mixed)$/.test(mode)) return true;
  const match = /^daily:v\d{1,4}:(\d{4}-\d{2}-\d{2}):estimate:(generated|facts|earth|wildlife|mixed):(easy|standard|hard):(solo|multiplayer|mixed)$/.exec(mode);
  if (!match) return false;
  const time = Date.parse(`${match[1]}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === match[1];
}
export function recordModeLabel(mode: string): string {
  if (isDailyMode(mode)) {
    const [,version,date,...regular] = mode.split(':');
    return `${date} UTC · ${recordModeLabel(regular.join(':'))} · ${version}`;
  }
  if (!mode.startsWith('estimate:')) return mode;
  const [,deck,difficulty,participation] = mode.split(':');
  return `${estimateDeckLabels[deck as EstimateDeck] ?? deck} · ${difficulty} · ${participation}`;
}

// Bound date-specific history without crowding established regular records out of storage.
function retainedRecords(records: GameRecord[]): GameRecord[] {
  return [...records.filter(row=>!isDailyMode(row.mode)).slice(-100), ...records.filter(row=>isDailyMode(row.mode)).slice(-180)];
}

export function parseStats(raw: string | null): StatsBook {
  try {
    const book = JSON.parse(raw ?? 'null');
    if (book?.version !== 1 || !Array.isArray(book.records) || !Array.isArray(book.seen)) return emptyStats();
    return {version:1,records:retainedRecords(book.records.filter((row: GameRecord) => row && typeof row.gameId === 'string' && validRecordMode(row.mode) && [row.played,row.best,row.total].every(n => Number.isSafeInteger(n) && n >= 0) && (!isDailyMode(row.mode) || (Number.isSafeInteger(row.first) && row.first! >= 0)))),seen:book.seen.filter((key: unknown) => typeof key === 'string').slice(-200)};
  } catch { return emptyStats(); }
}

export function recordRun(book: StatsBook, run: FinishedRun): StatsBook {
  if (!run.key || !Number.isSafeInteger(run.score) || run.score < 0 || !validRecordMode(run.mode) || book.seen.includes(run.key)) return book;
  const old = book.records.find(row => row.gameId === run.gameId && row.mode === run.mode);
  const updated: GameRecord = {gameId:run.gameId,mode:run.mode,played:(old?.played ?? 0)+1,best:Math.max(old?.best ?? 0,run.score),total:(old?.total ?? 0)+run.score,...(isDailyMode(run.mode)?{first:old?.first ?? run.score}:{})};
  return {version:1,records:retainedRecords([...book.records.filter(row => row !== old),updated]),seen:[...book.seen,run.key].slice(-200)};
}
