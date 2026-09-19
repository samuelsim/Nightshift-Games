import type { Cue } from './feedback-event';

export interface CountdownSnapshot { deadline: number; seconds: number; }

// Never replay missed seconds or sound on a freshly mounted/reconnected timer.
export function countdownCue(previous: CountdownSnapshot | null, next: CountdownSnapshot): Cue | null {
  if (!previous || !next.deadline || previous.deadline !== next.deadline || next.seconds >= previous.seconds) return null;
  if (next.seconds === 0 && previous.seconds <= 3) return 'timeup';
  if (next.seconds <= 0) return null;
  if (next.seconds <= 3) return 'urgent';
  if (next.seconds <= 5) return 'tick';
  if (next.seconds === 10) return 'hurry';
  return null;
}
