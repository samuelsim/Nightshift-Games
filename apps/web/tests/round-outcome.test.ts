import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import type { RoomView } from '@nightshift/protocol';
import { roundOutcome } from '../src/app/services/round-outcome';
import { roomFeedback } from '../src/app/services/feedback-event';

it('uses directional hunt sounds only for new local attempts',()=>{
  const before=room('pick-number',{solo:{playerId:'me',attempts:[]}},'SUBMISSION');
  for(const [hint,cue] of [['Go higher','higher'],['Go lower','lower']] as const) {
    const after=room('pick-number',{solo:{playerId:'me',attempts:[{value:5,hint}]}},'SUBMISSION');
    assert.equal(roomFeedback(before,after,'me')?.cue,cue);
    assert.equal(roomFeedback(after,after,'me'),null);
    assert.equal(roomFeedback(before,after,'spectator'),null);
  }
});

it('keeps unsubmitted solo rounds neutral while still grading submitted misses', () => {
  const pick = {solo:{playerId:'me',attempts:[] as {value:number;hint:string}[]},latestResult:{round:1,target:5,winners:[],pointsAwarded:{}}};
  assert.equal(roundOutcome(room('pick-number',pick),'me')?.cue,'reveal');
  pick.solo.attempts.push({value:1,hint:'Go higher'});
  assert.equal(roundOutcome(room('pick-number',pick),'me')?.cue,'incorrect');
  const human = {soloPlayerId:'me',result:{choices:[]},soloResult:{humanChoice:null as number|null,machineChoice:null as number|null,correctCount:0,bonus:0,points:0}};
  assert.equal(roundOutcome(room('human-exe',human),'me')?.cue,'reveal');
  human.soloResult.humanChoice=1; human.soloResult.machineChoice=0;
  assert.equal(roundOutcome(room('human-exe',human),'me')?.cue,'incorrect');
});

it('confirms accepted local discussion messages without replaying or echoing other players', () => {
  const before=room('one-of-us',{discussion:[]},'DISCUSSION');
  const after=room('one-of-us',{discussion:[{playerId:'me',text:'Look at that clue.'},{playerId:'other',text:'Agreed.'}]},'DISCUSSION');
  assert.equal(roomFeedback(before,after,'me')?.cue,'lock');
  assert.equal(roomFeedback(after,after,'me'),null);
  assert.equal(roomFeedback(null,after,'me'),null);
  assert.equal(roomFeedback(before,after,'spectator'),null);
  const other=room('one-of-us',{discussion:[{playerId:'other',text:'Hello'}]},'DISCUSSION');
  assert.equal(roomFeedback(before,other,'me'),null);
});

function room(gameId:string, publicView:unknown, phase='REVEAL'):RoomView {
  return {code:'ABCDE',phase:'PLAYING',hostPlayerId:'me',selectedGameId:gameId,players:[],games:[],nextGameVotes:{},nextGameStartsAt:0,
    activeGame:{gameId,phase,round:1,timerEndsAt:0,viewVersion:1,publicView}};
}
it('maps Infiltrator outcomes without leaking roles before reveal',()=>{
  const view={participants:['me','machine'],result:{machine:'machine',accused:'machine',authors:{A:'machine',B:'me'},votes:{me:'A'},points:{me:100},voided:false,explanation:'Detected'}};
  assert.equal(roundOutcome(room('human-infiltrator',view,'VOTING'),'me'),null);
  assert.equal(roundOutcome(room('human-infiltrator',view),'me')?.cue,'correct');
  assert.equal(roundOutcome(room('human-infiltrator',view),'machine')?.cue,'incorrect');
  view.result.voided=true;
  assert.equal(roundOutcome(room('human-infiltrator',view),'machine')?.cue,'reveal');
});
it('grades estimate accuracy independently of positive points and only after reveal',()=>{
  for(const [errorPercent,cue] of [[0,'correct'],[1,'correct'],[10,'close'],[25,'close'],[26,'incorrect'],[120,'incorrect']] as const) {
    const view={latestResult:{round:1,prompt:{answer:100,unit:'metres'},guesses:[{playerId:'me',errorPercent,points:500,grade:'Test'}]}};
    assert.equal(roundOutcome(room('estimate',view),'me')?.cue,cue);
    assert.equal(roundOutcome(room('estimate',view,'SUBMISSION'),'me'),null);
    assert.equal(roundOutcome(room('estimate',view),'spectator')?.cue,'reveal');
  }
});
it('distinguishes an exact number, nearest number and losing guess',()=>{
  const view={latestResult:{round:1,target:5,submissions:[{playerId:'me',value:5},{playerId:'near',value:4},{playerId:'other',value:2}],winners:['me'],pointsAwarded:{me:8}}};
  assert.equal(roundOutcome(room('pick-number',view),'me')?.cue,'correct');
  assert.equal(roundOutcome(room('pick-number',view),'other')?.cue,'incorrect');
  view.latestResult.winners=['near'];
  assert.equal(roundOutcome(room('pick-number',view),'near')?.cue,'close');
});
it('uses authored human answers and treats missing majority answers neutrally',()=>{
  const human={options:['Care','Measure'],result:{humanAnswer:0,machineAnswer:1,choices:[{playerId:'me',role:'HUMAN',points:0}]}};
  assert.match(roundOutcome(room('human-exe',human),'me')!.detail,/Care/);
  assert.equal(roundOutcome(room('human-exe',human),'me')?.cue,'incorrect');
  for(const [actual,points,cue] of [[null,0,'reveal'],['A',100,'correct'],['B',0,'incorrect']] as const) {
    assert.equal(roundOutcome(room('majority-rules',{result:{entries:[{playerId:'me',actual,points,prediction:'A'}]}}),'me')?.cue,cue);
  }
});
it('handles bluffing, correct suspicion without a group win, and voids',()=>{
  const view={participants:['me','bluffer'],result:{bluffer:'bluffer',accused:null,voided:false,votes:{me:'bluffer'},points:{bluffer:200},explanation:'Escaped'}};
  assert.equal(roundOutcome(room('one-of-us',view),'bluffer')?.cue,'correct');
  const own=roundOutcome(room('one-of-us',view),'me');
  assert.equal(own?.cue,'correct'); assert.equal(own?.points,0); assert.match(own!.detail,/did not catch/);
  view.result.voided=true;
  assert.equal(roundOutcome(room('one-of-us',view),'me')?.cue,'reveal');
});
it('confirms clue giver and guesser success without rewarding other players',()=>{
  const view={giver:'giver',answer:'apple',guesses:[{playerId:'me',text:'apple'}],outcome:'Cracked it!'};
  assert.equal(roundOutcome(room('restricted-clues',view),'me')?.points,100);
  assert.equal(roundOutcome(room('restricted-clues',view),'giver')?.points,100);
  assert.equal(roundOutcome(room('restricted-clues',view),'other')?.cue,'reveal');
});
it('announces wrong clue guesses during play, and never someone else’s guess',()=>{
  const before=room('restricted-clues',{guesses:[],clues:[]},'CLUES');
  const after=room('restricted-clues',{guesses:[{playerId:'me',text:'wrong'}],clues:[]},'CLUES');
  assert.equal(roomFeedback(before,after,'me')?.cue,'incorrect');
  assert.equal(roomFeedback(before,after,'other'),null);
  assert.equal(roomFeedback(after,after,'me'),null);
});
it('reads published results even if score updates arrive separately and never repeats',()=>{
  const before=room('human-exe',{result:null},'CHOICE');
  const reveal=room('human-exe',{options:['A','B'],result:{humanAnswer:0,machineAnswer:1,choices:[{playerId:'me',role:'MACHINE',points:100}]}});
  assert.equal(roomFeedback(before,reveal,'me')?.cue,'correct');
  assert.equal(roomFeedback(reveal,reveal,'me'),null);
  assert.equal(roomFeedback(null,reveal,'me'),null);
  const partial=room('human-exe',{result:null});
  assert.equal(roomFeedback(partial,reveal,'me')?.cue,'correct');
});
