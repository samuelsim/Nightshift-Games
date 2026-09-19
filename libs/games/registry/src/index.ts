import type { AnyGameDefinition } from '@nightshift/game-core';
import { pickNumberDefinition } from '@nightshift/games-pick-number';
import { estimateDefinition } from '@nightshift/games-estimate';
import { restrictedCluesDefinition } from '@nightshift/games-restricted-clues';
import { humanExeDefinition, infiltratorDefinition } from '@nightshift/games-human-exe';
import { majorityRulesDefinition } from '@nightshift/games-majority-rules';
import { oneOfUsDefinition } from '@nightshift/games-one-of-us';

export const gameRegistry = {
  [infiltratorDefinition.metadata.id]: infiltratorDefinition,
  [majorityRulesDefinition.metadata.id]: majorityRulesDefinition,
  [oneOfUsDefinition.metadata.id]: oneOfUsDefinition,
  [restrictedCluesDefinition.metadata.id]: restrictedCluesDefinition,
  [humanExeDefinition.metadata.id]: humanExeDefinition,
  [estimateDefinition.metadata.id]: estimateDefinition,
  [pickNumberDefinition.metadata.id]: pickNumberDefinition
} as const satisfies Record<string, AnyGameDefinition>;

export type GameId = keyof typeof gameRegistry;

export { gameCatalog } from './catalog';

export function getGameDefinition(gameId: string): AnyGameDefinition | null {
  return gameRegistry[gameId as GameId] ?? null;
}
