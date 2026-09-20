// Bump this version when changing daily content, ordering or generation rules.
// A daily set is fixed at game creation and independent of room identity/player count.
export const DAILY_VERSION = 'v4';
export function dailyIdentity(now: number): string {
  return `${DAILY_VERSION}:${new Date(now).toISOString().slice(0, 10)}`;
}

export function dailyRandom(identity: string, deck: string, difficulty: string): () => number {
  let seed = 2166136261;
  for (const char of `nightshift:estimate:${identity}:${deck}:${difficulty}`) {
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  }
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
