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
