import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { countdownCue } from '../src/app/services/countdown-cue';

it('warns at ten seconds, ticks at five/four, doubles the last three, and ends once', () => {
  const cues = Array.from({length: 12}, (_, i) => 11-i).map(seconds => countdownCue({deadline:60000, seconds:seconds+1},{deadline:60000,seconds}));
  assert.deepEqual(cues, [null,'hurry',null,null,null,null,'tick','tick','urgent','urgent','urgent','timeup']);
  assert.equal(countdownCue({deadline:60000,seconds:0},{deadline:60000,seconds:0}),null);
});
it('does not replay warnings on mount, timer replacement, cancellation or stale ticks', () => {
  assert.equal(countdownCue(null,{deadline:60000,seconds:3}),null);
  assert.equal(countdownCue({deadline:60000,seconds:4},{deadline:80000,seconds:3}),null);
  assert.equal(countdownCue({deadline:60000,seconds:4},{deadline:0,seconds:0}),null);
  assert.equal(countdownCue({deadline:60000,seconds:3},{deadline:60000,seconds:4}),null);
  assert.equal(countdownCue({deadline:60000,seconds:30},{deadline:60000,seconds:0}),null);
});
