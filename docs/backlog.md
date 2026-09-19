# Game backlog

Larger omissions now follow [this phased delivery plan](larger-features.md). Phase 1 delivers
host recovery and browser-local personal records. Phase 2 delivers Human.exe: Infiltrator.
Phase 3 delivers sourced Estimate Space Facts and difficulty selection. Phase 4a delivers daily
Estimate challenges. Custom decks are on hold at the user's request.

These concepts come from the original platform brief. Both first releases were implemented on
2026-09-11 and are available in the live game selector and next-game voting. The sections below
retain their design scope; see [the game pool](game-pool.md) for delivery and verification notes.

## 1. Majority Rules

**Status:** implemented. **Players:** 2–8; recommended 3–6. **Solo:** no.
**Session:** five rounds, approximately three minutes. **Categories:** party, guessing, competitive.

### Pitch

Read the room. Pick your own answer to an absurd either/or question, then predict what everyone
else will choose. Example: “The break-room microwave gains one power: self-cleaning or silencing
anyone who reheats fish?” There is no authored correct answer.

### Round loop and scoring

1. Show an original two-option prompt. Each player privately locks their own choice and a
   prediction of the other players' most popular choice: A, B, or a tie.
2. Reveal after everyone submits or 30 seconds elapse. Reveal the counts and predictions together.
3. A correct prediction earns 100 points. Calculate each player's target from the other submitted
   choices only, so voting for their own prediction cannot influence their target.
4. With two players, this becomes predicting your partner; the tie option is unavailable.
   With no other submissions, award no points and explain that the round had insufficient answers.
5. The host advances reveals. After round five, use the shared scoreboard and next-game election.

### First-release scope

- Thirty original prompts, shuffled without repeats within a session.
- Large mobile choice buttons and a clear separate prediction input; one final lock-in action.
- State machine: `SUBMISSION → REVEAL → RESULTS`, repeating submission/reveal for each round.
- Private choices and predictions until reveal; only submitted IDs and deadline are public.
- Snapshot round participants. Late joins play next round; disconnected players do not block
  reveal, while already locked submissions still count. Fewer than two connected players at
  the next round boundary ends the session early.
- Tests for ties, excluding one's own vote, duo play, timeouts, missing answers, invalid/duplicate
  actions, private views and automatic transition to the next elected game.

**Deferred:** custom prompts, free-text answers, audience participation and persistent statistics.

## 2. One of Us Is Lying

**Status:** implemented. **Players:** 3–8; recommended 4–6. **Solo:** no.
**Session:** three rounds, approximately five minutes. **Categories:** social deduction, bluffing, party.

### Pitch

Everyone receives a secret word except one bluffing player, who receives only its category.
Each player submits a short clue, then the group identifies who was improvising. Example:
the group sees “hammock”; the bluffer sees “something used to relax”.

### Round loop and scoring

1. Privately assign one bluffer and show the word/category. Rotate the bluffer without repeating
   until every available participant has had a turn.
2. Each player submits one clue of up to three words within 30 seconds. Publish all clues together
   with player names, preventing later players from copying earlier submissions.
3. Allow a 30-second discussion. Players can talk in person or use a short in-game discussion feed.
4. Give players 20 seconds to privately vote for another participant. Reveal votes simultaneously.
5. A unique highest-voted player is accused; a tie or no votes means nobody is accused.
   If the bluffer is caught, each non-bluffer who voted for them earns 100 points.
   Otherwise the bluffer earns 200 points. Reveal the word and role with the outcome.
6. The host advances rounds. After three rounds, use the shared scoreboard and next-game election.

### First-release scope

- Thirty original word/category pairs. Keep the deck and role assignment on the server.
- State machine: `CLUES → DISCUSSION → VOTING → REVEAL → RESULTS`.
- Reject clues containing the answer; bound clue and discussion length. Escape user text through
  Angular interpolation. Limit discussion messages per player and retain only a short round history.
- No self-votes or votes for non-participants; one locked ballot per player. Ballots remain private
  until reveal, independently of the platform's next-game votes.
- Snapshot round participants. Late joins wait for the next round. If the bluffer permanently
  leaves or fewer than three participants remain connected, void the round without points.
  A temporary drop can reconnect within the current phase; deadlines still apply. Recheck the
  player count before starting another round and finish early if necessary.
- Tests for private roles, non-repeating role rotation, simultaneous clue reveals, voting ties,
  no-vote outcomes, scoring, disconnect/void behaviour, reconnect views and stale actions.

**Deferred:** bluffer word-guess redemption, extra roles, voice chat, public matchmaking and custom decks.

## Delivery criteria for either game

Add a pure game package, metadata entry, server registry entry and Angular renderer. Preserve
existing games. Complete rule tests, a real two-client or three-client room smoke test as applicable,
and a mobile browser check. Verify that the game is eligible in next-game voting only at its
supported player counts. Update the game-pool documentation when it becomes playable.
