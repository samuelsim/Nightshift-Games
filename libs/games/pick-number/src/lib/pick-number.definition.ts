import { pickNumberMetadata } from './metadata';
import type { GameContext, GameDefinition, GameActionResult } from '@nightshift/game-core';
import { getConnectedPlayers } from '@nightshift/game-core';
import type { PickNumberNextRoundAction, PickNumberSubmitAction, PlayerAction, PlayerId } from '@nightshift/protocol';
import {
  type PickNumberPlayerView,
  type PickNumberPublicView,
  type PickNumberRoundResult,
  type PickNumberState
} from './pick-number.types';

type PickNumberAction = PickNumberSubmitAction | PickNumberNextRoundAction;

const maxRounds = 3;

export const pickNumberDefinition: GameDefinition<
  PickNumberState,
  PickNumberAction,
  PickNumberPublicView,
  PickNumberPlayerView
> = {
  metadata: pickNumberMetadata,
  createInitialState(context) {
    return createPickNumberState(context);
  },
  start(state) {
    if (state.phase !== 'SUBMISSION') {
      return reject(state, 'game_already_started', 'This game is already underway.');
    }

    return accept(state);
  },
  handleAction(state, playerId, action, context) {
    if (!isPickNumberAction(action)) {
      return reject(state, 'unknown_action', 'That move does not belong to this game.');
    }

    if (action.round !== state.round) return reject(state, 'stale_round', 'That round has moved on.');
    if (!context.players.get(playerId)?.connected) return reject(state, 'unknown_player', 'You are not connected.');

    if (action.type === 'PICK_NUMBER_NEXT_ROUND') {
      return advanceRound(state, playerId, context);
    }

    return submitNumber(state, playerId, action.value, context);
  },
  isFinished(state) {
    return state.phase === 'RESULTS';
  },
  tick(state, context) {
    if (state.solo) return accept(state.phase === 'SUBMISSION' && (context.now >= (state.timerEndsAt ?? 0) || !context.players.get(state.solo.playerId)?.connected) ? revealSolo(state) : state);
    const connected = getConnectedPlayers(context.players);
    if (state.phase === 'SUBMISSION' && connected.length && Object.keys(state.submissions).length &&
        connected.every(p => state.submissions[p.id] !== undefined)) return accept(revealRound(state, context));
    return accept(state);
  },
  getPublicView(state) {
    return {
      phase: state.phase,
      solo: state.solo ? {playerId:state.solo.playerId,attempts:state.solo.attempts} : null,
      timerEndsAt: state.timerEndsAt ?? 0,
      round: state.round,
      maxRounds: state.maxRounds,
      target: state.target,
      submittedPlayerIds: Object.keys(state.submissions),
      scores: state.scores,
      latestResult: state.history.at(-1) ?? null,
      history: state.history
    };
  },
  getPlayerView(state, playerId) {
    const submittedValue = state.submissions[playerId] ?? null;

    return {
      submitted: submittedValue !== null,
      submittedValue
    };
  }
};

export function createPickNumberState(context: GameContext): PickNumberState {
  const scores = Object.fromEntries(
    Array.from(context.players.keys()).map((playerId) => [playerId, 0])
  );

  return {
    ...soloSetup(context),
    phase: 'SUBMISSION',
    round: 1,
    maxRounds,
    target: null,
    submissions: {},
    scores,
    history: []
  };
}

export function submitNumber(
  state: PickNumberState,
  playerId: PlayerId,
  value: number,
  context: GameContext
): GameActionResult<PickNumberState> {
  if (state.phase !== 'SUBMISSION') {
    return reject(state, 'not_accepting_submissions', 'This round is not taking guesses right now.');
  }

  if (!Number.isInteger(value) || value < 1 || value > 10) {
    return reject(state, 'number_out_of_range', 'Pick a whole number from 1 to 10.');
  }

  if (!context.players.has(playerId)) {
    return reject(state, 'unknown_player', 'You are not in this room.');
  }

  if (state.solo) {
    if (playerId !== state.solo.playerId) return reject(state,'wait_next_round','Join the hunt next round.');
    if (context.now >= (state.timerEndsAt ?? 0)) return accept(revealSolo(state));
    if (state.solo.attempts.some(a=>a.value===value)) return reject(state,'repeat_guess','Try a different number.');
    const next = {...state, solo:{...state.solo,attempts:[...state.solo.attempts,{value,hint:value===state.solo.target?'Found it!':value<state.solo.target?'Go higher':'Go lower'}]}};
    return accept(value===state.solo.target || next.solo.attempts.length===3 ? revealSolo(next) : next);
  }

  if (state.submissions[playerId] !== undefined) {
    return reject(state, 'already_submitted', 'You already picked a number this round.');
  }

  const nextState: PickNumberState = {
    ...state,
    submissions: {
      ...state.submissions,
      [playerId]: value
    }
  };

  const connectedPlayerIds = getConnectedPlayers(context.players).map((player) => player.id);
  const everyoneSubmitted = connectedPlayerIds.every(
    (connectedPlayerId) => nextState.submissions[connectedPlayerId] !== undefined
  );

  if (!everyoneSubmitted) {
    return accept(nextState);
  }

  return accept(revealRound(nextState, context));
}

export function advanceRound(
  state: PickNumberState,
  playerId: PlayerId,
  context: GameContext
): GameActionResult<PickNumberState> {
  if (playerId !== context.hostPlayerId) {
    return reject(state, 'host_only', 'Only the host can advance the round.');
  }

  if (state.phase === 'RESULTS') {
    return reject(state, 'game_finished', 'This game is already finished.');
  }

  if (state.phase !== 'REVEAL') {
    return reject(state, 'round_not_revealed', 'Wait for everyone to pick before moving on.');
  }

  if (state.round >= state.maxRounds) {
    return accept({
      ...state,
      phase: 'RESULTS',
      submissions: {},
      target: null
    });
  }

  return accept({
    ...state,
    ...soloSetup(context),
    phase: 'SUBMISSION',
    round: state.round + 1,
    submissions: {},
    target: null
  });
}

function soloSetup(ctx: GameContext) {
  const connected = getConnectedPlayers(ctx.players);
  return {solo:connected.length===1 ? {playerId:connected[0]!.id,target:Math.floor(ctx.random()*10)+1,attempts:[]} : null,timerEndsAt:connected.length===1 ? ctx.now+20_000 : 0};
}
function revealSolo(state: PickNumberState): PickNumberState {
  const solo=state.solo!;
  const last=solo.attempts.at(-1);
  const won=last?.value===solo.target;
  const points=won ? [100,60,30][solo.attempts.length-1]! : 0;
  return {...state,phase:'REVEAL',target:solo.target,timerEndsAt:0,
    scores:{...state.scores,[solo.playerId]:(state.scores[solo.playerId]??0)+points},
    history:[...state.history,{round:state.round,target:solo.target,submissions:last?[{playerId:solo.playerId,value:last.value}]:[],winners:won?[solo.playerId]:[],pointsAwarded:{[solo.playerId]:points}}]};
}

function revealRound(state: PickNumberState, context: GameContext): PickNumberState {
  const target = Math.floor(context.random() * 10) + 1;
  const submissions = Object.entries(state.submissions).map(([playerId, value]) => ({
    playerId,
    value
  }));
  const closestDistance = Math.min(...submissions.map((submission) => Math.abs(submission.value - target)));
  const winners = submissions
    .filter((submission) => Math.abs(submission.value - target) === closestDistance)
    .map((submission) => submission.playerId);
  const pointsAwarded = Object.fromEntries(
    winners.map((winnerId) => {
      const exactBonus = state.submissions[winnerId] === target ? 3 : 0;
      return [winnerId, 5 + exactBonus];
    })
  );
  const scores = { ...state.scores };

  for (const winnerId of winners) {
    scores[winnerId] = (scores[winnerId] ?? 0) + (pointsAwarded[winnerId] ?? 0);
  }

  const result: PickNumberRoundResult = {
    round: state.round,
    target,
    submissions,
    winners,
    pointsAwarded
  };

  return {
    ...state,
    phase: 'REVEAL',
    target,
    scores,
    history: [...state.history, result]
  };
}

function isPickNumberAction(action: PlayerAction): action is PickNumberAction {
  return action.type === 'PICK_NUMBER_SUBMIT' || action.type === 'PICK_NUMBER_NEXT_ROUND';
}

function accept(state: PickNumberState): GameActionResult<PickNumberState> {
  return { ok: true, state };
}

function reject(state: PickNumberState, code: string, message: string): GameActionResult<PickNumberState> {
  return {
    ok: false,
    state,
    error: { code, message }
  };
}

