export function randomIntInclusive(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIntInclusive(random, 0, i);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

// Prefer unseen cards, then the least recently shown. Shuffle the selected hand too.
export function freshHand<T>(cards: readonly T[], key: (card:T)=>string, previous: readonly string[], count:number, random:()=>number): T[] {
  const lastSeen=new Map(previous.map((value,index)=>[value,index]));
  const candidates=shuffled(cards,random);
  candidates.sort((a,b)=>(lastSeen.get(key(a)) ?? -1)-(lastSeen.get(key(b)) ?? -1));
  return shuffled(candidates.slice(0,count),random);
}
