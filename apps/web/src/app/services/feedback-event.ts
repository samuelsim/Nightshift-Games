import type { RoomView } from '@nightshift/protocol';
import type { CluesPublicView } from '@nightshift/games-restricted-clues';
import type { PickNumberPublicView } from '@nightshift/games-pick-number';
import type { OneOfUsPublicView } from '@nightshift/games-one-of-us';
import { roundOutcome } from './round-outcome';

export type Cue = 'tap' | 'lock' | 'start' | 'reveal' | 'score' | 'finish' | 'error' | 'tick' | 'hurry' | 'urgent' | 'timeup' | 'correct' | 'close' | 'incorrect' | 'assign' | 'higher' | 'lower';
export interface FeedbackEvent { readonly cue: Cue; readonly text: string; }

// Public state only: feedback must never disclose secret roles or other players' inputs.
export function roomFeedback(previous: RoomView | null, next: RoomView, playerId: string | null): FeedbackEvent | null {
  if (!previous || previous.code !== next.code) return null;
  if (next.hostPlayerId && previous.hostPlayerId !== next.hostPlayerId) {
    const name = next.players.find(player => player.id === next.hostPlayerId)?.nickname ?? 'Another player';
    return {cue:'lock',text:next.hostPlayerId === playerId ? 'You’re the host now · Keep the games going' : `${name} is the host now`};
  }
  const oldGame = previous.activeGame;
  const game = next.activeGame;
  if (next.phase === 'SCOREBOARD' && previous.phase !== 'SCOREBOARD') return { cue: 'finish', text: 'Shift complete · Final scores are in' };
  if (next.phase === 'PLAYING' && (previous.phase !== 'PLAYING' || oldGame?.gameId !== game?.gameId)) {
    return { cue: 'start', text: `${next.games.find(g => g.id === game?.gameId)?.name ?? 'Game'} · Let’s play` };
  }
  if (game && oldGame && next.phase === 'PLAYING') {
    const result = roundOutcome(next, playerId);
    const oldResult = roundOutcome(previous, playerId);
    if (result && (!oldResult || game.round !== oldGame.round)) return {cue:result.cue, text:`${result.title} · +${result.points.toLocaleString()} points`};
    const gain = (next.players.find(p => p.id === playerId)?.score ?? 0) - (previous.players.find(p => p.id === playerId)?.score ?? 0);
    if (game.phase === 'REVEAL' && oldGame.phase !== 'REVEAL') return { cue: gain > 0 ? 'score' : 'reveal', text: gain > 0 ? `Round revealed · +${gain.toLocaleString()} points` : 'Round revealed · See how everyone did' };
    if (game.round !== oldGame.round) return { cue: 'start', text: `Round ${game.round} · Fresh start` };
    if (game.phase !== oldGame.phase) return { cue: 'start', text: game.phase === 'VOTING' ? 'Voting is open' : game.phase === 'DISCUSSION' ? game.gameId === 'human-infiltrator' ? 'Responses revealed · Read the signals' : 'Clues revealed · Time to discuss' : 'Next phase' };
    if(game.gameId==='pick-number' && game.phase==='SUBMISSION') {
      const solo=(game.publicView as PickNumberPublicView).solo;
      const before=(oldGame.publicView as PickNumberPublicView).solo;
      if(solo?.playerId===playerId && solo && solo.attempts.length>(before?.attempts.length??0)) return {cue:solo.attempts.at(-1)!.hint==='Go higher'?'higher':'lower',text:`${solo.attempts.at(-1)!.hint} · ${3-solo.attempts.length} guesses left`};
    }
    if (game.gameId === 'restricted-clues' && game.phase === 'CLUES') {
      const before = oldGame.publicView as CluesPublicView;
      const after = game.publicView as CluesPublicView;
      if (JSON.stringify(before.guesses) !== JSON.stringify(after.guesses) && after.guesses?.at(-1)?.playerId === playerId) return {cue:'incorrect',text:'Not that word · Try another guess'};
      if (after.giver === playerId && after.clues?.length > (before.clues?.length ?? 0)) return {cue:'lock',text:'Clue sent · Let them think'};
    }
    if (game.gameId === 'one-of-us' && game.phase === 'DISCUSSION' && playerId) {
      const before = (oldGame.publicView as OneOfUsPublicView).discussion ?? [];
      const after = (game.publicView as OneOfUsPublicView).discussion ?? [];
      if (after.filter(message => message.playerId === playerId).length > before.filter(message => message.playerId === playerId).length) {
        return { cue: 'lock', text: 'Message sent · Keep the discussion going' };
      }
    }
    if (playerId && ['submittedPlayerIds', 'votedPlayerIds'].some(key => !locked(oldGame.publicView, playerId, key) && locked(game.publicView, playerId, key))) return { cue: 'lock', text: 'Locked in · Waiting for the room' };
  }
  if (playerId && next.nextGameVotes[playerId] !== previous.nextGameVotes[playerId] && next.nextGameVotes[playerId]) return { cue: 'lock', text: 'Next-game vote saved' };
  if (next.phase === 'LOBBY') {
    if (next.selectedGameId !== previous.selectedGameId) return { cue: 'tap', text: `${next.games.find(g => g.id === next.selectedGameId)?.name ?? 'Game'} selected` };
    if (next.players.find(p => p.id === playerId)?.ready && !previous.players.find(p => p.id === playerId)?.ready) return { cue: 'lock', text: 'You’re ready · Let the games begin' };
    if (next.players.filter(p => p.connected).length > previous.players.filter(p => p.connected).length) return { cue: 'tap', text: 'A player joined the room' };
  }
  return null;
}
function locked(value: unknown, id: string, key: string): boolean {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record[key]) && record[key].includes(id);
}
