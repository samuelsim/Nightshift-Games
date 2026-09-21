import { strict as assert } from 'node:assert';
import { it } from 'node:test';
import { questionGlyph, questionGlyphs } from '../src/app/shared/question-art-library';
import { factDeck } from '../../../libs/games/estimate/src/lib/estimate.facts';
import { earthDeck, wildlifeDeck } from '../../../libs/games/estimate/src/lib/estimate.topics';
import { createPrompts } from '../../../libs/games/estimate/src/lib/estimate.prompts';
import { questionKey } from '../../../libs/games/estimate/src/lib/estimate.selection';

const space = new Set(['sun','moon','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']);

it('covers every fact and all 66 generated templates with a supported, bounded drawing', () => {
  const facts = [...factDeck, ...earthDeck, ...wildlifeDeck];
  assert.equal(facts.length, 90);
  const templates = new Set<string>();
  for (const tier of ['easy','standard','hard'] as const) {
    // Different generated quantities must not affect either coverage or subject choice.
    const subjects = new Map<string,string>();
    for (const random of [() => 0, () => .42, () => .999]) {
      const cards = createPrompts(random, tier, [], 100);
      assert.equal(cards.length, tier === 'standard' ? 26 : 20);
      for (const card of cards) {
        const key = questionKey(card.question);
        templates.add(`${tier}:${key}`);
        assert.ok(card.art, card.question);
        assert.ok(questionGlyph(card.art) || space.has(card.art), card.question);
        if (subjects.has(key)) assert.equal(card.art, subjects.get(key), card.question);
        subjects.set(key, card.art);
      }
    }
  }
  assert.equal(templates.size, 66);
  for (const card of facts) {
    assert.ok(card.art, card.id);
    assert.ok(questionGlyph(card.art) || space.has(card.art), card.id);
  }
  for (const drawing of Object.values(questionGlyphs)) {
    for (const path of [drawing.shape, drawing.lines, drawing.accent?.[1] ?? '']) {
      assert.match(path, /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]*$/);
      assert.ok(path.length < 650, 'Small bounded geometry for each active subject');
    }
  }
});

it('keeps species distinct and avoids misleading or answer-revealing subject choices', () => {
  for (const card of wildlifeDeck) assert.equal(card.art, card.source!.url.split('/').at(-1), card.id);
  assert.equal(new Set(wildlifeDeck.map(card => card.art)).size, 8);
  assert.equal(earthDeck.find(card => card.id === 'earth-layers')!.art, 'earth');
  assert.equal(earthDeck.find(card => card.id === 'fresh-dense')!.art, 'water');
  assert.equal(earthDeck.find(card => card.id === 'water-boil')!.art, 'steam');
  assert.equal(earthDeck.find(card => card.id === 'named-oceans')!.art, 'ocean');
  const easy = createPrompts(() => .5, 'easy', [], 100);
  assert.equal(easy.find(card => card.question.includes('spiders'))!.art, 'sock');
  assert.notDeepEqual(questionGlyph('giant-panda'), questionGlyph('red-panda'));
  assert.notDeepEqual(questionGlyph('two-toed-sloth'), questionGlyph('sloth-bear'));
  assert.equal(factDeck.find(card => card.id === 'moon-radius')!.artMeasure, 'radius');
  assert.equal(factDeck.find(card => card.id === 'earth-diameter')!.artMeasure, 'diameter');
  assert.equal(factDeck.find(card => card.id === 'earth-core')!.artMeasure, undefined);
});
