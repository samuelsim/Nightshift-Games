import { randomIntInclusive } from '@nightshift/game-core';
import type { EstimatePrompt } from './estimate.types';
import { extraPrompts } from './estimate.extra-prompts';
import { selectPrompts } from './estimate.selection';

// Generated quantities keep answers exact, content original, and sessions varied.
export function createPrompts(random: () => number, difficulty: 'easy' | 'standard' | 'hard' = 'standard', previous: readonly string[] = [], count = 5): readonly EstimatePrompt[] {
  if (difficulty !== 'standard') return createTierPrompts(random, difficulty, previous, count);
  const days = randomIntInclusive(random, 3, 19);
  const boxes = randomIntInclusive(random, 12, 48);
  const hours = randomIntInclusive(random, 4, 16);
  const rows = randomIntInclusive(random, 14, 39);
  const seats = randomIntInclusive(random, 17, 36);
  const weeks = randomIntInclusive(random, 3, 13);
  const prompts: EstimatePrompt[] = [
    { question: `${rows} people each shake hands once with everyone else. How many handshakes?`, unit: 'handshakes', answer: rows * (rows - 1) / 2,
      explanation: `${rows} × ${rows - 1} ÷ 2. Each handshake involves two people.` },
    { question: `A printer makes ${seats} pages per minute for ${hours} hours. How many pages?`, unit: 'pages', answer: seats * hours * 60,
      explanation: `${seats} pages × 60 minutes × ${hours} hours.` },
    { question: `You save ${boxes} coins each day for ${weeks} weeks. How many coins?`, unit: 'coins', answer: boxes * weeks * 7,
      explanation: `${boxes} × ${weeks} × 7.` },
    { question: `A square room is ${days} metres on each side. How many 1-metre-square tiles cover it?`, unit: 'tiles', answer: days * days,
      explanation: `${days} × ${days}. Ignore gaps and cutting waste.` },
    { question: `${boxes} robots each need 8 batteries. A pack holds 4. How many packs?`, unit: 'packs', answer: boxes * 2,
      explanation: `${boxes} × 8 ÷ 4. Nobody remembered the charger.` },
    { question: `A ${seats}-minute playlist repeats for ${seats} hours. How many complete plays?`, unit: 'plays', answer: 60,
      explanation: `${seats} × 60 minutes ÷ ${seats}. The numbers cancel out.` },
    { question: `A lift carries ${hours} people per trip. How many trips move ${hours * rows} people?`, unit: 'trips', answer: rows,
      explanation: `${hours * rows} ÷ ${hours}, assuming every trip is full.` },
    { question: `How many seconds pass in ${days} days?`, unit: 'seconds', answer: days * 86400,
      explanation: `${days} × 24 hours × 60 minutes × 60 seconds.` },
    { question: `The break room has ${boxes} boxes of 24 biscuits. How many biscuits is that?`, unit: 'biscuits',
      answer: boxes * 24, explanation: `${boxes} boxes × 24 biscuits. A very optimistic snack budget.` },
    { question: `A tap drips once every 3 seconds for ${hours} hours. How many drips?`, unit: 'drips',
      answer: hours * 1200, explanation: `${hours} × 3,600 seconds ÷ 3 seconds per drip.` },
    { question: `A cinema has ${rows} rows with ${seats} seats each. How many seats?`, unit: 'seats',
      answer: rows * seats, explanation: `${rows} rows × ${seats} seats.` },
    { question: `A very dedicated duck walks 2 kilometres daily for ${weeks} weeks. How many metres?`, unit: 'metres',
      answer: weeks * 14000, explanation: `${weeks} weeks × 7 days × 2,000 metres. No days off for this duck.` }
  ];
  for (let i = prompts.length - 1; i > 0; i--) {
    const j = randomIntInclusive(random, 0, i);
    [prompts[i], prompts[j]] = [prompts[j]!, prompts[i]!];
  }
  return selectPrompts([...prompts,...extraPrompts(random,difficulty)],random,previous,count);
}

function createTierPrompts(random: () => number, difficulty: 'easy' | 'hard', previous: readonly string[], count: number): EstimatePrompt[] {
  const a = randomIntInclusive(random, 3, 9);
  const b = randomIntInclusive(random, 12, 25);
  const cards: EstimatePrompt[] = difficulty === 'easy' ? [
    {question:`${a} tables have 4 chairs each. How many chairs?`,unit:'chairs',answer:a*4,explanation:`${a} × 4.`},
    {question:`${b} snack packs hold 2 biscuits each. How many biscuits?`,unit:'biscuits',answer:b*2,explanation:`${b} × 2.`},
    {question:`How many minutes are in ${a} hours?`,unit:'minutes',answer:a*60,explanation:`${a} × 60.`},
    {question:`A ${a}-metre ribbon is cut into 10 equal pieces. How long is each piece in centimetres?`,unit:'centimetres',answer:a*10,explanation:`${a} × 100 ÷ 10.`},
    {question:`${b} people each bring 10 stickers. How many stickers?`,unit:'stickers',answer:b*10,explanation:`${b} × 10.`},
    {question:`A square has sides of ${a} metres. What is its perimeter?`,unit:'metres',answer:a*4,explanation:`Four sides: ${a} × 4.`}
  ] : [
    {question:`${b*3} people shake hands once with everyone else. How many handshakes?`,unit:'handshakes',answer:b*3*(b*3-1)/2,explanation:`${b*3} × ${b*3-1} ÷ 2.`},
    {question:`A tank is ${a} m long, ${b} m wide and 1.5 m deep. How many litres fill it?`,unit:'litres',answer:a*b*1500,explanation:`${a} × ${b} × 1.5 cubic metres × 1,000 litres.`},
    {question:`A printer runs at ${b} pages/minute for ${a} hours, but rests 12 minutes each hour. How many pages?`,unit:'pages',answer:b*a*48,explanation:`${b} × ${a} × (60 − 12).`},
    {question:`${b*10} boxes each hold ${a*6} biscuits. One third are eaten. How many biscuits remain?`,unit:'biscuits',answer:b*10*a*4,explanation:`${b*10} × ${a*6} × 2 ÷ 3.`},
    {question:`A machine doubles its ${a} starting beads every minute. How many beads after 8 doublings?`,unit:'beads',answer:a*256,explanation:`${a} × 2 to the power 8.`},
    {question:`A shop sells ${b*100} tokens at ${a} cents each, with a 15% discount. Total cost in cents?`,unit:'cents',answer:b*100*a*.85,explanation:`${b*100} × ${a} × 0.85.`}
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomIntInclusive(random, 0, i);
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return selectPrompts([...cards,...extraPrompts(random,difficulty)],random,previous,count);
}
