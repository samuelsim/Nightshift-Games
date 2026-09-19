import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { gameCatalog } from '@nightshift/games-registry/catalog';
import type { Player } from '@nightshift/protocol';
import { chooseNextGame } from './next-game-policy';
import { eligibleGames } from './next-game-policy';
const players: Player[] = ['a','b','c'].map(id => ({id,nickname:id,avatarId:'moon',connected:true,ready:true,host:id==='a',score:0,joinedAt:0,lastSeenAt:0}));
describe('Next-game voting', () => {
  it('only offers Majority Rules from two players and One of Us Is Lying from three', () => {
    const solo = eligibleGames(gameCatalog, players.slice(0,1)).map(g=>g.id);
    const duo = eligibleGames(gameCatalog, players.slice(0,2)).map(g=>g.id);
    const trio = eligibleGames(gameCatalog, players).map(g=>g.id);
    assert.equal(solo.includes('majority-rules'),false); assert.equal(solo.includes('one-of-us'),false);
    assert.ok(duo.includes('majority-rules')); assert.equal(duo.includes('one-of-us'),false);
    assert.ok(trio.includes('one-of-us'));
    assert.equal(solo.includes('human-infiltrator'),false);
    assert.equal(duo.includes('human-infiltrator'),false);
    assert.ok(trio.includes('human-infiltrator'));
  });
  it('selects the plurality winner and lets players replace their ballot', () => {
    const votes = new Map([['a','estimate'],['b','estimate'],['c','human-exe']]);
    assert.equal(chooseNextGame(gameCatalog, players, votes, 'pick-number', () => 0), 'estimate');
    votes.set('b','human-exe');
    assert.equal(chooseNextGame(gameCatalog, players, votes, 'pick-number', () => 0), 'human-exe');
  });
  it('breaks ties using injected randomness', () => {
    const votes = new Map([['a','estimate'],['b','human-exe']]);
    const first = chooseNextGame(gameCatalog, players,votes,'pick-number',()=>0);
    const last = chooseNextGame(gameCatalog, players,votes,'pick-number',()=>.999);
    assert.notEqual(first,last); assert.ok(['estimate','human-exe'].includes(first!));
  });
  it('ignores disconnected, outsider and ineligible votes and avoids unvoted replay', () => {
    const solo = [players[0]!, {...players[1]!,connected:false}];
    const votes = new Map([['a','restricted-clues'],['b','restricted-clues'],['outside','restricted-clues']]);
    const selected = chooseNextGame(gameCatalog,solo,votes,'estimate',()=>0);
    assert.notEqual(selected,'restricted-clues'); assert.notEqual(selected,'estimate');
    assert.equal(chooseNextGame(gameCatalog,[],votes,'estimate',()=>0),null);
  });
});
