import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { emptyStats, parseStats, recordRun, validRecordMode } from '../src/app/services/personal-stats';

it('persists bests and totals without recounting a refreshed final scoreboard', () => {
  const run={key:'unique-run:player',gameId:'estimate',mode:'solo',score:5000};
  const book=recordRun(emptyStats(),run);
  const restored=parseStats(JSON.stringify(book));
  assert.deepEqual(recordRun(restored,run),book);
  const next=recordRun(restored,{...run,key:'another:player',score:1000});
  assert.deepEqual(next.records[0],{gameId:'estimate',mode:'solo',played:2,best:5000,total:6000});
});
it('separates modes, accepts zero finishes, and ignores invalid scores', () => {
  let book=emptyStats();
  for(const mode of ['solo','multiplayer','mixed']) book=recordRun(book,{key:mode,gameId:'human-exe',mode,score:0});
  assert.equal(book.records.length,3);
  assert.equal(book.records.every(row=>row.played===1),true);
  assert.equal(recordRun(book,{key:'bad',gameId:'estimate',mode:'solo',score:NaN}),book);
});
it('recovers from corrupt or incompatible storage', () => {
  for(const raw of ['broken','null','{}','{"version":2}','{"version":1,"records":[null],"seen":[2]}']) assert.deepEqual(parseStats(raw),emptyStats());
});

it('keeps Estimate deck, difficulty and participation records separate through reload', () => {
  let book=emptyStats();
  const modes=['estimate:mixed:standard:solo','daily:v3:2026-09-19:estimate:mixed:hard:solo','solo','estimate:generated:standard:solo','estimate:facts:easy:solo','estimate:facts:hard:solo','estimate:facts:hard:multiplayer','estimate:facts:hard:mixed','estimate:earth:easy:solo','estimate:wildlife:hard:multiplayer','daily:v1:2026-09-16:estimate:earth:standard:solo','daily:v1:2026-09-16:estimate:wildlife:easy:solo'];
  for(const mode of modes) book=recordRun(book,{key:mode,gameId:'estimate',mode,score:1000});
  assert.equal(book.records.length,modes.length);
  assert.deepEqual(parseStats(JSON.stringify(book)),book);
  assert.equal(recordRun(book,{key:'bad',gameId:'estimate',mode:'estimate:facts:impossible:solo',score:1000}),book);
});

it('preserves daily first finishes while updating replay bests, and deduplicates refreshes', () => {
  const mode='daily:v1:2026-09-15:estimate:generated:standard:solo';
  const first={key:'first-run:p0',gameId:'estimate',mode,score:0};
  const initial=recordRun(emptyStats(),first);
  const replay={...first,key:'second-run:p0',score:900};
  const best=recordRun(parseStats(JSON.stringify(initial)),replay);
  assert.deepEqual(best.records[0],{gameId:'estimate',mode,first:0,best:900,total:900,played:2});
  assert.deepEqual(recordRun(parseStats(JSON.stringify(best)),replay),best);
  let separated=best;
  for(const suffix of ['daily:v1:2026-09-16:estimate:generated:standard:solo','daily:v2:2026-09-15:estimate:generated:standard:solo','daily:v1:2026-09-15:estimate:generated:standard:mixed','estimate:generated:standard:solo']) separated=recordRun(separated,{...first,key:suffix,mode:suffix});
  assert.equal(separated.records.length,5);
  for(const invalid of ['daily:v1:2026-02-30:estimate:generated:standard:solo','daily:v1:2026-09-15:estimate:generated:impossible:solo','daily:v1:invalid:estimate:facts:easy:solo']) assert.equal(validRecordMode(invalid),false);
});

it('bounds daily history without evicting regular records', () => {
  let book=recordRun(emptyStats(),{key:'regular',gameId:'estimate',mode:'solo',score:100});
  for(let i=0;i<190;i++) {
    const date=new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10);
    book=recordRun(book,{key:date,gameId:'estimate',mode:`daily:v1:${date}:estimate:facts:easy:solo`,score:i});
  }
  assert.equal(book.records.length,181);assert.equal(book.records[0]!.mode,'solo');
  assert.equal(book.records[1]!.mode,'daily:v1:2026-01-11:estimate:facts:easy:solo');
  assert.deepEqual(parseStats(JSON.stringify(book)),book);
});
