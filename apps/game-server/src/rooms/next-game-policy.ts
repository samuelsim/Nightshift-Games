import type { GameMetadata, Player } from '@nightshift/protocol';

export function eligibleGames(games: readonly GameMetadata[], players: readonly Player[]): readonly GameMetadata[] {
  const count = players.filter(p => p.connected).length;
  return games.filter(game => count >= game.minPlayers && count <= game.maxPlayers);
}

export function chooseNextGame(games: readonly GameMetadata[], players: readonly Player[], votes: ReadonlyMap<string, string>, currentGameId: string, random: () => number): string | null {
  const eligible = eligibleGames(games, players);
  if (!eligible.length) return null;
  const counts = new Map(eligible.map(g => [g.id, 0]));
  for (const player of players.filter(p => p.connected)) {
    const vote = votes.get(player.id);
    if (vote && counts.has(vote)) counts.set(vote, counts.get(vote)! + 1);
  }
  const best = Math.max(...counts.values());
  let finalists = eligible.filter(g => counts.get(g.id) === best);
  if (!best && finalists.some(g => g.id !== currentGameId)) finalists = finalists.filter(g => g.id !== currentGameId);
  return finalists[Math.floor(random() * finalists.length)]!.id;
}
