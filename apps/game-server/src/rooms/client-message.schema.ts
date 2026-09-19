import { z } from 'zod';

const playerActionSchema = z
  .object({
    type: z.string().min(1)
  })
  .passthrough();

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('SET_ESTIMATE_OPTIONS'), deck: z.enum(['generated', 'facts', 'earth', 'wildlife', 'mixed']), difficulty: z.enum(['easy', 'standard', 'hard']), daily: z.boolean().default(false) }),
  z.object({ type: z.literal('VOTE_NEXT_GAME'), gameId: z.string().min(1).max(64) }),
  z.object({
    type: z.literal('SET_READY'),
    ready: z.boolean()
  }),
  z.object({
    type: z.literal('SELECT_GAME'),
    gameId: z.string().min(1)
  }),
  z.object({
    type: z.literal('START_GAME')
  }),
  z.object({
    type: z.literal('RETURN_TO_LOBBY')
  }),
  z.object({
    type: z.literal('GAME_ACTION'),
    action: playerActionSchema
  })
]);
