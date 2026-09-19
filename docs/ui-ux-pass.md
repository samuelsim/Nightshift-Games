# UI/UX pass — September 2026

## Changes

- Compact responsive game picker with original illustrations, one selected-game description, and concise Estimate settings.
- QR invitations, home game gallery, records and in-game voting open on demand. Voting opens automatically at the scoreboard; its collapsed heading shows your selection.
- Smaller game stages and titles, fewer repeated Estimate instructions, and concise help summaries for every game/solo variant. Full rules remain available; Escape closes focused help.
- Shared focus outlines now include selects. Disclosure controls have hover/pressed feedback; selects and disclosures use the existing opt-in tap cue. Existing mute and reduced-motion preferences remain respected.
- Copy-link success/error feedback. Player names and host badges wrap without squeezing short names into individual letters.
- Estimate final scores now point to next-game voting instead of incorrectly telling guests to wait for a lobby return.

## Verification

- Production build passed (existing qrcode/ws CommonJS warnings).
- 98 regression tests passed, including audio, outcomes, voting and multiplayer transport.
- Browser checks at 1280 × 900 (desktop lobby), 390 × 844 (mobile lobby and Estimate round), and 320 × 740 (home). No horizontal overflow in measured layouts.
- Verified room creation, host readiness, deck selection, Estimate submission/reveal, help and Escape dismissal, voting selection, return to lobby and copy-link confirmation. No browser console errors observed.
- Actual speaker output was not independently measured; sound synthesis regression tests passed. Sounds still require Sound on and an active tab.
