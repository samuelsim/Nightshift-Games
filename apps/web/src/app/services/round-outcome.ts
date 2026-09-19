import type { RoomView } from '@nightshift/protocol';
import type { EstimatePublicView } from '@nightshift/games-estimate';
import type { PickNumberPublicView } from '@nightshift/games-pick-number';
import type { HumanPublicView } from '@nightshift/games-human-exe';
import type { InfiltratorPublicView } from '@nightshift/games-human-exe';
import type { MajorityPublicView } from '@nightshift/games-majority-rules';
import type { OneOfUsPublicView } from '@nightshift/games-one-of-us';
import type { CluesPublicView } from '@nightshift/games-restricted-clues';

export interface RoundOutcome {
  cue: 'correct' | 'close' | 'incorrect' | 'reveal';
  title: string;
  detail: string;
  points: number;
}
const outcome = (cue: RoundOutcome['cue'], title: string, detail: string, points = 0): RoundOutcome => ({cue,title,detail,points});
const skipped = () => outcome('reveal','No response this round','Watch the reveal and join the next round.');

// Use revealed public results, never private roles or speculative score deltas.
export function roundOutcome(room: RoomView, id: string | null): RoundOutcome | null {
  const game = room.activeGame;
  if (!id || !game || game.phase !== 'REVEAL' || !game.publicView) return null;
  switch (game.gameId) {
    case 'human-infiltrator': {
      const view=game.publicView as InfiltratorPublicView;
      const result=view.result;
      if (!result) return null;
      if (result.voided) return outcome('reveal','Signal lost',result.explanation);
      if (!view.participants.includes(id)) return skipped();
      if (result.machine===id) return outcome(result.accused===id?'incorrect':'correct',result.accused===id?'Cover blown!':'You passed as human!',result.explanation,result.points[id]??0);
      if (!result.votes[id]) return outcome('reveal','No vote submitted',result.explanation);
      const correct=result.authors[result.votes[id]!]===result.machine;
      return outcome(correct?'correct':'incorrect',correct?'Machine spotted!':'That response was human',correct&&result.accused!==result.machine?'Your suspicion was right, but the room did not catch the machine.':result.explanation,result.points[id]??0);
    }
    case 'estimate': {
      const result = (game.publicView as EstimatePublicView).latestResult;
      if (!result || result.round !== game.round) return null;
      const guess = result.guesses.find(g => g.playerId === id);
      if (!guess) return skipped();
      return outcome(guess.errorPercent <= 1 ? 'correct' : guess.errorPercent <= 25 ? 'close' : 'incorrect', guess.grade,
        `${guess.errorPercent.toFixed(1)}% away · The answer was ${result.prompt.answer.toLocaleString()} ${result.prompt.unit}.`, guess.points);
    }
    case 'pick-number': {
      const view = game.publicView as PickNumberPublicView;
      const result = view.latestResult;
      if (!result || result.round !== game.round) return null;
      if (view.solo?.playerId === id) {
        if (!view.solo.attempts.length) return skipped();
        return outcome(result.winners.includes(id) ? 'correct' : 'incorrect', result.winners.includes(id) ? 'Number found!' : 'The number escaped', `${view.solo.attempts.length} of 3 guesses used · The target was ${result.target}.`, result.pointsAwarded[id] ?? 0);
      }
      const guess = result.submissions.find(g => g.playerId === id);
      if (!guess) return skipped();
      const exact = guess.value === result.target;
      const won = result.winners.includes(id);
      return outcome(exact ? 'correct' : won ? 'close' : 'incorrect', exact ? 'Right on the number!' : won ? 'Closest guess!' : 'Not the closest this time',
        `You picked ${guess.value} · The number was ${result.target}.`, result.pointsAwarded[id] ?? 0);
    }
    case 'human-exe': {
      const view = game.publicView as HumanPublicView;
      if (!view.result) return null;
      if (view.soloResult && view.soloPlayerId === id) {
        const r = view.soloResult;
        if (r.humanChoice === null && r.machineChoice === null) return skipped();
        return outcome(r.correctCount === 2 ? 'correct' : r.correctCount === 1 ? 'close' : 'incorrect', r.correctCount === 2 ? 'Dual-core complete!' : r.correctCount === 1 ? 'One system online' : 'Classification missed', `${r.correctCount}/2 correct · ${r.bonus} speed bonus points.`, r.points);
      }
      const choice = view.result.choices.find(c => c.playerId === id);
      if (!choice) return skipped();
      return outcome(choice.points > 0 ? 'correct' : 'incorrect', choice.points > 0 ? 'Directive matched!' : 'Directive mismatch',
        `Your ${choice.role} answer: ${view.options[choice.role === 'HUMAN' ? view.result.humanAnswer : view.result.machineAnswer]}.`, choice.points);
    }
    case 'majority-rules': {
      const result = (game.publicView as MajorityPublicView).result;
      if (!result) return null;
      const entry = result.entries.find(e => e.playerId === id);
      if (!entry) return skipped();
      if (entry.actual === null) return outcome('reveal','No prediction to score','No other answers were submitted.');
      return outcome(entry.points > 0 ? 'correct' : 'incorrect', entry.points > 0 ? 'You read the room!' : 'Prediction missed',
        `You predicted ${entry.prediction} · The other players chose ${entry.actual}.`, entry.points);
    }
    case 'one-of-us': {
      const view = game.publicView as OneOfUsPublicView;
      const result = view.result;
      if (!result) return null;
      if (result.voided) return outcome('reveal','Round voided',result.explanation);
      if (!view.participants.includes(id)) return skipped();
      if (result.bluffer === id) return outcome(result.accused === id ? 'incorrect' : 'correct', result.accused === id ? 'You were caught!' : 'You got away with it!', result.explanation, result.points[id] ?? 0);
      if (!result.votes[id]) return outcome('reveal','No vote submitted',result.explanation);
      const correct = result.votes[id] === result.bluffer;
      return outcome(correct ? 'correct' : 'incorrect', correct ? 'You spotted the bluffer!' : 'Wrong suspect',
        correct && result.accused !== result.bluffer ? 'Your suspicion was right, but the room did not catch the bluffer. No points this round.' : result.explanation, result.points[id] ?? 0);
    }
    case 'restricted-clues': {
      const view = game.publicView as CluesPublicView;
      const solved = view.guesses?.find(g => g.text === view.answer);
      if (!view.answer) return null;
      if (solved && (solved.playerId === id || view.giver === id)) return outcome('correct',view.giver === id ? 'Your clues cracked it!' : 'You cracked it!', `The word was ${view.answer}.`,100);
      return outcome('reveal',solved ? 'The room cracked it!' : 'Round ended',view.outcome);
    }
  }
  return null;
}
