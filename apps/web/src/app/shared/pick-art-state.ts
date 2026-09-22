import type { PickNumberPublicView } from '@nightshift/games-pick-number';

/** Consume public information only; never inspect the solo secret or private guesses. */
export function pickArtState(view: PickNumberPublicView) {
  if (view.phase !== 'SUBMISSION') {
    return { mode: !view.solo ? 'reveal' : view.latestResult?.winners.length ? 'found' : 'miss', display: String(view.target ?? '?'),
      caption: view.phase === 'RESULTS' ? 'ROUND UP' : 'NUMBER REVEALED' } as const;
  }
  if (view.solo) {
    const hint = view.solo.attempts.at(-1)?.hint;
    return { mode: hint === 'Go higher' ? 'higher' : hint === 'Go lower' ? 'lower' : 'search',
      display: '?', caption: hint === 'Go higher' ? 'SEARCH HIGHER' : hint === 'Go lower' ? 'SEARCH LOWER' : 'SCANNING FOR A NUMBER' } as const;
  }
  return { mode: view.submittedPlayerIds.length ? 'locked' : 'draw', display: '?',
    caption: view.submittedPlayerIds.length ? 'GUESSES SEALED' : 'MAKE YOUR PICK' } as const;
}
