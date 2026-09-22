import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { challenges, humanExeDefinition } from '../../../libs/games/human-exe/src/lib/definition';
import { majorityPrompts } from '../../../libs/games/majority-rules/src/lib/content';
import { majorityRulesDefinition } from '../../../libs/games/majority-rules/src/lib/definition';
import { pickArtState } from '../src/app/shared/pick-art-state';
import { questionGlyph } from '../src/app/shared/question-art-library';
import type { GameContext } from '@nightshift/game-core';
import type { PickNumberPublicView } from '@nightshift/games-pick-number';

const ctx:GameContext = {now:0,random:()=>.4,hostPlayerId:'p0',players:new Map(['p0','p1'].map(id=>[id,
  {id,nickname:id,avatarId:'moon',connected:true,ready:true,host:id==='p0',score:0,joinedAt:0,lastSeenAt:0}]))};
it('covers all Human scenarios and both sides of all Majority prompts', () => {
  assert.equal(challenges.length,40);
  assert.equal(majorityPrompts.length,50);
  for(const card of challenges) { assert.ok(card.art,card.question);assert.ok(questionGlyph(card.art),card.question); }
  for(const card of majorityPrompts) {
    assert.equal(card.art?.length,2,card.question);
    for(const subject of card.art!) assert.ok(questionGlyph(subject),card.question);
  }
  assert.equal(challenges.find(c=>c.question.includes('childhood toy'))?.art,'toy');
  assert.deepEqual(majorityPrompts.find(c=>c.question.includes('desk companion'))?.art,['dragon','snail']);
});
it('does not let Human answer shuffling or roles control public art', () => {
  const state=humanExeDefinition.createInitialState(ctx);
  for(const card of challenges) {
    const original=humanExeDefinition.getPublicView({...state,deck:[card]},ctx);
    const changed=humanExeDefinition.getPublicView({...state,roles:{p0:'MACHINE',p1:'HUMAN'},deck:[{...card,human:card.machine,machine:card.human}]},ctx);
    assert.deepEqual(changed,original);
    assert.equal('human' in original,false); assert.equal('roles' in original,false);
  }
  for(const difficulty of ['easy','standard']) {
    const s=humanExeDefinition.createInitialState({...ctx,gameOptions:{difficulty}});
    for(const card of s.deck) assert.equal(card.art,challenges.find(c=>c.question===card.question)!.art);
  }
});
it('keeps Majority art aligned with choice order and independent of unexposed votes', () => {
  const state=majorityRulesDefinition.createInitialState(ctx);
  for(const card of majorityPrompts) {
    const before=majorityRulesDefinition.getPublicView({...state,deck:[card]},ctx);
    const after=majorityRulesDefinition.getPublicView({...state,deck:[card],submissions:{p0:{choice:'B',prediction:'A'}}},ctx);
    assert.deepEqual(after.prompt,before.prompt);
    assert.equal(after.result,null);
    assert.equal('submissions' in after,false);
  }
});
it('only reveals a Pick target after submission and follows public hints', () => {
  const v:PickNumberPublicView={phase:'SUBMISSION',round:1,maxRounds:3,target:null,submittedPlayerIds:[],scores:{},latestResult:null,history:[]};
  assert.equal(pickArtState(v).mode,'draw');
  assert.equal(pickArtState({...v,target:7}).display,'?');
  assert.equal(pickArtState({...v,submittedPlayerIds:['p0']}).mode,'locked');
  const solo={playerId:'p0',attempts:[]};
  assert.equal(pickArtState({...v,solo}).mode,'search');
  assert.equal(pickArtState({...v,solo:{...solo,attempts:[{value:3,hint:'Go higher'}]}}).mode,'higher');
  assert.equal(pickArtState({...v,solo:{...solo,attempts:[{value:8,hint:'Go lower'}]}}).mode,'lower');
  const result={round:1,target:7,submissions:[],winners:['p0'],pointsAwarded:{p0:100}};
  assert.equal(pickArtState({...v,phase:'REVEAL',target:7,latestResult:result}).mode,'reveal');
  assert.equal(pickArtState({...v,solo,phase:'REVEAL',target:7,latestResult:result}).mode,'found');
  assert.equal(pickArtState({...v,phase:'REVEAL',target:7,latestResult:result}).display,'7');
  assert.equal(pickArtState({...v,solo,phase:'REVEAL',target:7}).mode,'miss');
});
