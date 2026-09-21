import { randomIntInclusive } from '@nightshift/game-core';
import type { EstimatePrompt, EstimateSpaceSubject } from './estimate.types';
import { earthDeck, wildlifeDeck } from './estimate.topics';
import { extraSpace } from './estimate.extra-facts';
import { selectPrompts } from './estimate.selection';
import { spaceMeasures } from './estimate.space-art';

type Difficulty = 'easy' | 'standard' | 'hard';
type Fact = EstimatePrompt & { readonly id: string; readonly difficulty: Difficulty };
const source = (body: string) => ({
  title: `NASA Science · ${body[0]!.toUpperCase()}${body.slice(1)} facts`,
  url: `https://science.nasa.gov/${body}/${body === 'jupiter' ? 'jupiter-facts' : 'facts'}/`,
  reviewedAt: '2026-09-15'
});
const convention = 'Use the stated units. Decimals are welcome; approximate values are scored by percentage error.';
function fact(id: string, difficulty: Difficulty, body: EstimateSpaceSubject, question: string, unit: string, answer: number, explanation: string): Fact {
  return { id, difficulty, art: body, ...(spaceMeasures[id] ? { artMeasure: spaceMeasures[id] } : {}), question, unit, answer, explanation, convention, source: source(body) };
}

// Server-only reviewed snapshot. No live requests, changing moon counts or current distances.
// All questions target the rounded values on their linked source, not measurement precision.
export const factDeck: readonly Fact[] = [
  ...extraSpace,
  fact('earth-ocean', 'easy', 'earth', 'About what percentage of Earth’s surface is covered by ocean?', '%', 71, 'NASA gives about 71%; enter a percentage, not a fraction.'),
  fact('earth-oxygen', 'easy', 'earth', 'Near sea level, about what percentage of Earth’s atmosphere is oxygen?', '%', 21, 'Oxygen makes up about 21% of the atmosphere near the surface.'),
  fact('earth-year', 'easy', 'earth', 'Roughly how many days does Earth take to orbit the Sun?', 'days', 365.25, 'The rounded orbital period is 365.25 days.'),
  fact('moon-orbit', 'easy', 'moon', 'About how many Earth days does the Moon take to complete one orbit relative to the stars (not its phase cycle)?', 'Earth days', 27, 'NASA rounds the orbital period to 27 days; the visible phase cycle is longer.'),
  fact('mars-day', 'easy', 'mars', 'Approximately how many hours does Mars take to rotate once?', 'hours', 24.6, 'NASA gives 24.6 hours, close to Earth’s rotation time.'),
  fact('jupiter-width', 'easy', 'jupiter', 'Jupiter is roughly how many times as wide as Earth?', 'times Earth’s width', 11, 'NASA describes Jupiter as about 11 Earth widths across.'),
  fact('earth-diameter', 'standard', 'earth', 'About how wide is Earth across its equator?', 'kilometres', 12756, 'This is the equatorial diameter, not the polar diameter or circumference.'),
  fact('moon-radius', 'standard', 'moon', 'What is the Moon’s approximate radius?', 'kilometres', 1740, 'NASA rounds the radius to 1,740 kilometres. Radius is half the diameter.'),
  fact('mars-year', 'standard', 'mars', 'Approximately how many Earth days make one year on Mars?', 'Earth days', 687, 'One Martian orbit takes about 687 Earth days.'),
  fact('jupiter-year', 'standard', 'jupiter', 'Approximately how many Earth years does Jupiter take to orbit the Sun?', 'Earth years', 12, 'NASA rounds Jupiter’s orbital period to 12 Earth years.'),
  fact('saturn-year', 'standard', 'saturn', 'Approximately how many Earth years does Saturn take to orbit the Sun?', 'Earth years', 29.4, 'A Saturnian year lasts about 29.4 Earth years.'),
  fact('sun-surface', 'standard', 'sun', 'About how hot is the Sun’s visible surface (photosphere), in degrees Celsius?', '°C', 5500, 'The photosphere is about 5,500 °C; this question does not ask about the hotter core.'),
  fact('earth-core', 'hard', 'earth', 'What is the approximate radius of Earth’s solid inner core?', 'kilometres', 1221, 'NASA gives about 1,221 kilometres for the solid inner core radius.'),
  fact('moon-samples', 'hard', 'moon', 'About how many kilograms of lunar rock and soil did the Apollo astronauts bring back in total?', 'kilograms', 382, 'The Apollo sample total is about 382 kilograms.'),
  fact('mars-distance', 'hard', 'mars', 'What is Mars’s average distance from the Sun, in millions of kilometres?', 'million kilometres', 228, 'NASA rounds the average to 228 million kilometres. Enter 228, not 228,000,000.'),
  fact('jupiter-radius', 'hard', 'jupiter', 'What is Jupiter’s approximate mean radius?', 'kilometres', 69911, 'NASA’s size section gives a radius of 69,911 kilometres.'),
  fact('saturn-diameter', 'hard', 'saturn', 'What is Saturn’s approximate equatorial diameter?', 'kilometres', 120500, 'NASA rounds the equatorial diameter to 120,500 kilometres.'),
  fact('sun-radius', 'hard', 'sun', 'What is the Sun’s approximate radius?', 'kilometres', 700000, 'NASA rounds the solar radius to about 700,000 kilometres.')
];

export function createFactPrompts(random: () => number, difficulty: Difficulty, deck: 'facts' | 'earth' | 'wildlife' | 'mixed' = 'facts', previous: readonly string[] = [], count = 5): readonly EstimatePrompt[] {
  const cards = (deck === 'mixed' ? [...factDeck,...earthDeck,...wildlifeDeck] : deck === 'earth' ? earthDeck : deck === 'wildlife' ? wildlifeDeck : factDeck).filter(card => card.difficulty === difficulty);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomIntInclusive(random, 0, i);
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return selectPrompts(cards,random,previous,count);
}
