import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { RoomView } from '@nightshift/protocol';
import { roomFeedback } from '../src/app/services/feedback-event';

function room(): RoomView {
  return { code:'ABCDE',phase:'PLAYING',hostPlayerId:'me',selectedGameId:'estimate',games:[],nextGameVotes:{},nextGameStartsAt:0,
    players:[{id:'me',nickname:'Me',avatarId:'moon',connected:true,ready:true,host:true,score:0,joinedAt:0,lastSeenAt:0}],
    activeGame:{gameId:'estimate',phase:'SUBMISSION',round:1,timerEndsAt:0,viewVersion:1,publicView:{submittedPlayerIds:[]}} };
}
describe('Public game feedback', () => {
  it('stays silent on initial connection, reconnect snapshot and unchanged patches', () => {
    const next=room(); assert.equal(roomFeedback(null,next,'me'),null);
    assert.equal(roomFeedback({...next,code:'OTHER'},next,'me'),null);
    assert.equal(roomFeedback(next,{...next},'me'),null);
  });
  it('confirms only the local accepted submission', () => {
    const old=room(); const next={...old,activeGame:{...old.activeGame!,publicView:{submittedPlayerIds:['other']}}};
    assert.equal(roomFeedback(old,next,'me'),null);
    const locked={...next,activeGame:{...next.activeGame,publicView:{submittedPlayerIds:['other','me']}}};
    assert.equal(roomFeedback(next,locked,'me')?.cue,'lock');
    assert.equal(roomFeedback(locked,locked,'me'),null);
  });
  it('recognizes a private ballot lock even after a clue was already submitted', () => {
    const old={...room(),activeGame:{...room().activeGame!,phase:'VOTING',publicView:{submittedPlayerIds:['me'],votedPlayerIds:[]}}};
    const next={...old,activeGame:{...old.activeGame,publicView:{submittedPlayerIds:['me'],votedPlayerIds:['me']}}};
    assert.equal(roomFeedback(old,next,'me')?.cue,'lock');
  });
  it('uses one reveal cue and only celebrates the local score delta', () => {
    const old=room(); const reveal={...old,activeGame:{...old.activeGame!,phase:'REVEAL'}};
    assert.equal(roomFeedback(old,reveal,'me')?.cue,'reveal');
    const scored={...reveal,players:reveal.players.map(p=>({...p,score:100}))};
    assert.deepEqual(roomFeedback(old,scored,'me'),{cue:'score',text:'Round revealed · +100 points'});
    assert.equal(roomFeedback(scored,scored,'me'),null);
  });
  it('announces session completion once and a replay start', () => {
    const old=room(); const final={...old,phase:'SCOREBOARD' as const};
    assert.equal(roomFeedback(old,final,'me')?.cue,'finish');
    assert.equal(roomFeedback(final,final,'me'),null);
    assert.equal(roomFeedback(final,old,'me')?.cue,'start');
  });
  it('confirms ballot replacements but does not announce other players votes', () => {
    const old=room(); const other={...old,nextGameVotes:{other:'human-exe'}};
    assert.equal(roomFeedback(old,other,'me'),null);
    assert.equal(roomFeedback(old,{...old,nextGameVotes:{me:'human-exe'}},'me')?.text,'Next-game vote saved');
  });
});
