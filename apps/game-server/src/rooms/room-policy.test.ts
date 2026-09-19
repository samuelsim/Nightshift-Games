import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import type { GameMetadata, Player } from '@nightshift/protocol';
import { canStartGame, chooseNextHost, hostAfterDisconnect, type PolicyDecision } from './room-policy';

const game: GameMetadata = {
  id: 'pick-number',
  name: 'Pick a Number',
  tagline: 'Tiny test game.',
  minPlayers: 2,
  maxPlayers: 4,
  supportsSolo: false,
  recommendedPlayers: [2, 3, 4],
  estimatedMinutes: 2,
  categories: ['party']
};

function player(id: string, ready = true, connected = true, host = false, joinedAt = 1): Player {
  return {
    id,
    nickname: id,
    avatarId: 'moon',
    connected,
    ready,
    host,
    score: 0,
    joinedAt,
    lastSeenAt: joinedAt
  };
}

function assertRejected(decision: PolicyDecision): asserts decision is Extract<PolicyDecision, { ok: false }> {
  assert.equal(decision.ok, false);
}

describe('room policy', () => {
  it('holds a dropped host for ten seconds, promotes the earliest connected player, and never steals the seat back', () => {
    const players=[player('host',true,false,true,1),player('later',true,true,false,3),player('next',true,true,false,2)];
    assert.equal(hostAfterDisconnect(players,'host',10_000),'host');
    assert.equal(hostAfterDisconnect(players,'host',10_001),'next');
    assert.equal(hostAfterDisconnect(players.map(p=>({...p,connected:true})),'next',20_000),'next');
    assert.equal(hostAfterDisconnect(players.map(p=>({...p,connected:false})),'host',20_000),'host');
    assert.equal(hostAfterDisconnect(players,'',20_000),'next');
  });
  it('allows the host to start when connected players satisfy requirements', () => {
    const decision = canStartGame({
      players: [player('p1', false, true, true), player('p2')],
      hostPlayerId: 'p1',
      requesterPlayerId: 'p1',
      game
    });

    assert.equal(decision.ok, true);
  });

  it('rejects non-host starts and unready players', () => {
    const nonHost = canStartGame({
      players: [player('p1', true, true, true), player('p2')],
      hostPlayerId: 'p1',
      requesterPlayerId: 'p2',
      game
    });
    const unready = canStartGame({
      players: [player('p1', true, true, true), player('p2', false)],
      hostPlayerId: 'p1',
      requesterPlayerId: 'p1',
      game
    });

    assertRejected(nonHost);
    assert.equal(nonHost.code, 'host_only');
    assertRejected(unready);
    assert.equal(unready.code, 'players_not_ready');
  });

  it('chooses the earliest connected player as next host', () => {
    assert.equal(
      chooseNextHost([
        player('later', true, true, false, 20),
        player('gone', true, false, false, 1),
        player('earlier', true, true, false, 10)
      ]),
      'earlier'
    );
  });
});
