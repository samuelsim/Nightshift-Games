// Browser-safe metadata only. Never import server definitions or secret decks here.
import { pickNumberMetadata } from '../../pick-number/src/lib/metadata';
import { estimateMetadata } from '../../estimate/src/lib/metadata';
import { restrictedCluesMetadata } from '../../restricted-clues/src/lib/metadata';
import { humanExeMetadata } from '../../human-exe/src/lib/metadata';
import { majorityRulesMetadata } from '../../majority-rules/src/lib/metadata';
import { oneOfUsMetadata } from '../../one-of-us/src/lib/metadata';
import { infiltratorMetadata } from '../../human-exe/src/lib/infiltrator.metadata';
export const gameCatalog = [estimateMetadata, restrictedCluesMetadata, humanExeMetadata, infiltratorMetadata, majorityRulesMetadata, oneOfUsMetadata, pickNumberMetadata];
