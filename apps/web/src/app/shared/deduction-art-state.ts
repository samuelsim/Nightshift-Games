import type { CluesPublicView } from '@nightshift/games-restricted-clues';
import type { InfiltratorPublicView } from '@nightshift/games-human-exe';
import type { OneOfUsPublicView } from '@nightshift/games-one-of-us';

export type DeductionArt = {
  game: 'restricted-clues' | 'one-of-us' | 'human-infiltrator';
  mode: 'collect' | 'discuss' | 'vote' | 'reveal' | 'results';
  outcome: 'neutral' | 'caught' | 'escaped' | 'void';
  label: string;
  caption: string;
  key: string;
};

// Deliberately accepts public views only. No words, roles, authors or player IDs
// enter the drawing, even when a reveal packet contains them.
export function deductionArtState(game: string, view: unknown): DeductionArt | undefined {
  if (game !== 'restricted-clues' && game !== 'one-of-us' && game !== 'human-infiltrator') return undefined;
  if (!view) return undefined;
  const v = view as CluesPublicView | OneOfUsPublicView | InfiltratorPublicView;
  const mode = v.phase === 'RESULTS' ? 'results' : v.phase === 'REVEAL' ? 'reveal'
    : v.phase === 'VOTING' ? 'vote' : v.phase === 'DISCUSSION' ? 'discuss' : 'collect';
  let outcome: DeductionArt['outcome'] = 'neutral';
  if (mode === 'reveal' && 'result' in v && v.result) {
    outcome = v.result.voided ? 'void' : v.result.accused === ('machine' in v.result ? v.result.machine : v.result.bluffer) ? 'caught' : 'escaped';
  }
  const copy = {
    'restricted-clues': {
      collect: ['THE WORD VAULT', 'Trade clues. Crack the lock.'],
      discuss: ['THE WORD VAULT', 'Piece the clues together.'],
      vote: ['THE WORD VAULT', 'Piece the clues together.'],
      reveal: ['VAULT OPEN', 'The word is out.'],
      results: ['CASE CLOSED', 'Every clue counted.']
    },
    'one-of-us': {
      collect: ['SEALED CLUES', 'Keep your clue close.'],
      discuss: ['CONNECT THE CLUES', 'Which story does not fit?'],
      vote: ['MAKE YOUR ACCUSATION', 'Put your suspicion to a vote.'],
      reveal: [outcome === 'void' ? 'ROUND VOID' : outcome === 'caught' ? 'BLUFFER CAUGHT' : 'BLUFFER ESCAPED', 'The secret is out.'],
      results: ['CASE CLOSED', 'The room has spoken.']
    },
    'human-infiltrator': {
      collect: ['TRANSMIT YOUR COVER', 'Make it sound human.'],
      discuss: ['ANONYMOUS SIGNALS', 'Read between the lines.'],
      vote: ['SCAN FOR THE MACHINE', 'Choose the signal that feels wrong.'],
      reveal: [outcome === 'void' ? 'ROUND VOID' : outcome === 'caught' ? 'MACHINE DETECTED' : 'SIGNAL LOST', 'Identities revealed.'],
      results: ['TRANSMISSION COMPLETE', 'The final signals are in.']
    }
  }[game][mode];
  return {game, mode, outcome, label:copy[0]!, caption:copy[1]!, key:`${game}:${v.round}:${mode}:${outcome}`};
}
