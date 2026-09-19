# Reconnect Decisions

Colyseus keeps player seats reconnectable for 120 seconds. Host control has a separate ten-second grace period (see larger-features.md).

- Player IDs are Colyseus session IDs.
- The browser stores the Colyseus reconnection token in `sessionStorage`.
- On an unexpected drop, the server marks the player disconnected and holds the seat for 120 seconds.
- On reconnect, the same player becomes connected again and receives the current room/game view.
- On intentional leave, the server removes the player immediately.
- On refresh or temporary connection loss, the server treats the seat as reconnectable for 120 seconds.
- On reconnect timeout, the player is removed from the room state.
- If the host leaves permanently, the earliest connected player becomes host.
- Rooms are allowed to auto-dispose once empty.

This is good enough for refreshes, brief mobile app switches, and flaky hospital/warehouse break-room Wi-Fi. Cross-device identity, account-based restore, and long-lived rooms are deferred.

Estimate uses the optional game tick to reveal when all remaining connected players have
submitted. Already locked guesses still score. A player who reconnects after reveal waits for
the next round. Temporary host loss pauses controls for up to ten seconds before a connected replacement is selected.

Next-game votes from disconnected players are excluded at tally time. Permanent departure
deletes the ballot. Reconnection restores ballot eligibility if the vote window is still open.
With nobody connected, the scoreboard countdown pauses and restarts at fifteen seconds on return.
New games recheck the current player count before starting.

Restricted Clues reveals and skips a round if its clue giver disconnects. Human.exe excludes
disconnected participants from its wait condition; fresh mid-round arrivals receive a directive
next round. If every original participant leaves, remaining late joiners can advance from an
empty reveal. After ten seconds, host control transfers to the earliest-joined connected player; a returning former host does not reclaim it automatically.
