import { shuffled } from '@nightshift/game-core';
import type { EstimatePrompt } from './estimate.types';

// Treat a generated puzzle with different numbers as the same template.
export const questionKey = (question: string): string => question.replace(/\d+(?:[.,]\d+)*/g, '#');

export function selectPrompts(cards: readonly EstimatePrompt[], random: () => number, previous: readonly string[] = []): EstimatePrompt[] {
  const lastSeen = new Map(previous.map((question, index) => [questionKey(question), index]));
  const candidates = shuffled(cards, random);
  candidates.sort((a,b)=>(lastSeen.get(questionKey(a.question)) ?? -1)-(lastSeen.get(questionKey(b.question)) ?? -1));
  // Unseen first, oldest next; shuffle the resulting hand so replay order is not predictable.
  return shuffled(candidates.slice(0,5),random);
}
