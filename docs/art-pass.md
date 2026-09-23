# Question art rollout

## Priorities and acceptance gates

1. Performance: inline, code-native SVG for small illustrations. No image downloads, fonts, canvas loops, animation library or network requests. Target less than 5 kB compressed added JavaScript per iteration; measure production output. Render only the active subject. No endless animation; entrance motion ends within 1.5 seconds.
2. Readability: replace the existing stage rather than add question panels. Preserve its 90 px desktop / 68 px mobile scene, leave controls and question typography intact, hide decorative art from assistive technology, and honor reduced motion. Verify 320 px and desktop layouts.
3. Correctness: author subjects in content data, never infer them by matching arbitrary question text. Missing art keeps the existing game stage. Art is schematic, with no answer-derived counts, scales, measured angles or sizes. Hidden-word and role games must use public phase art until information is revealed to everyone.

## Iterations

### 1 — Foundation and Estimate space (implemented)

Ten original SVG subjects cover all 30 space cards: Sun, Moon and eight planets. Each card carries an optional typed `art` key assigned by its authored subject. Questions comparing Mars with Earth therefore show Mars; lunar samples show the Moon. Other decks retain existing visuals. Art replaces stage props and mascot during these questions, persists into reveal, and re-enters only on a new round/question. No gameplay, timing, daily seed, scoring or answer changes. These are shared subject illustrations, not yet individually bespoke compositions for every question.

### 2 — Estimate content coverage (implemented)

Added 63 original drawings: eight wildlife species, six Earth/water subjects and 49 everyday-maths objects. Together with iteration 1, all 90 fact cards and 66 generated templates now have explicit art assignments. Species are distinct; Earth scenes distinguish atmosphere, seafloor, waves, ice, steam and liquid water. Seven whole-body space measurements have unnumbered radius/diameter guides; inner-core questions deliberately do not. See [the full coverage audit](estimate-art-coverage.md).

Illustrations show subjects rather than the quantities needed to solve the question. Elephant trunk tips, bear teeth, spider legs, labelled Earth layers and measured ocean boundaries are not exposed. Related questions share subjects, so this is full content coverage rather than a different bespoke composition for every prompt. Four short entrance motions settle within 1.4 seconds and respect reduced motion. Illustrations occupy the existing stage with no added controls or panels.

### 3 — Human.exe, Majority Rules, Pick a Number (implemented)

Human.exe: explicit subject art for all 40 scenarios, independent of private roles, shuffled option positions and correct answers. Majority: explicit A/B subject pairs for all 50 prompts, identical layout dimensions and styling, and no animation or colour changes based on unrevealed votes. Abstract alternatives about the same object may deliberately share a drawing; text carries their distinction. See [the coverage audit](social-art-coverage.md).

Pick: an original console with searching, higher/lower, sealed-guesses, reveal, solo-success and solo-miss states. The console consumes only the public view and displays `?` throughout submission. Multiplayer reveals stay neutral because the existing personal result card identifies each player's outcome. Entrance/hint motions are finite and respect reduced motion. No extra UI panels or audio triggers were added.

### 4 — Restricted Clues, One of Us, Infiltrator (implemented)

Three original phase-driven SVG scenes replace the fallback mascot/props. Restricted Clues uses a rotating vault dial and a door that opens at reveal. One of Us uses sealed envelopes, a connected clue board, an inspecting lens and a ballot box. Infiltrator uses a signal terminal, equal anonymous response cards, a radar sweep and a revealed machine identity. Public outcomes receive caught, escaped or void badges; the existing personal result card explains each player's score.

All artwork is derived from public phase and, only at reveal, the public outcome. Neither secret words nor roles, response text, authors, votes or codewords enter the drawing. Word-specific reveal drawings are not part of this iteration: the vault's paper and detective's notes remain generic, and the revealed word stays in the existing text. Motions finish within 1.2 seconds, re-enter only on round/phase/outcome changes, and have explicit reduced-motion end states. The scene preserves the existing 90 px / 68 px footprint. No gameplay or audio changes.

### 5 — Integration and visual QA (implemented; device measurements outstanding)

Review all seven games, transitions and decks; long text, reconnect, late join, spectators, reduced motion and mobile. Record compressed bundle growth, DOM complexity and absence of added asset requests. Compare question-to-art coverage against source content; do not claim full bespoke question coverage until the audit is complete.

The integration audit corrected Pick's full-viewport panels and oversized number tiles, host-label overlap with the help button on small screens, room links restoring a different room's session, and missing persistent errors on the join form. Pick instructions now defer to the actual clock rather than hard-code a duration. Four Majority subjects replace inappropriate handshake/music illustrations: salute, finger guns, applause and silent dance. Generic subject sharing elsewhere remains intentional; this is not a bespoke image for each permutation.

## Extension contract

`IllustrationSubject` in the protocol is now the shared, browser-safe vocabulary; `EstimateArtSubject` remains a compatibility alias. Add a subject to the vocabulary, render it in `QuestionArtComponent` or the path catalogue, and assign it in authored content. Public projection must continue excluding answers/explanations/sources until reveal. Do not import server content into the browser. Use per-game lazy bundles if cumulative art exceeds the initial payload budget.

Everyday and wildlife drawings live in the typed `question-art-library.ts` path catalogue. Each renders a silhouette, optional accent and linework; linework outside a silhouette uses a pale stroke for dark-background contrast. Assign generated-template subjects directly at the template, wildlife subjects by their authored species, and Earth subjects in the explicit card-ID map. Coverage tests fail for unsupported or missing art. The optional public `artMeasure` field contains only `radius` or `diameter`, never the numeric measurement.

## Iteration 1 verification — 2026-09-21

- Production build passes. Complete lazy game-stage chunk is 17.17 kB raw / 4.97 kB estimated transfer, including existing stage artwork. This is the total chunk, not a measured before/after delta. Initial bundle reports 513.47 kB and a 500 kB budget warning; question art is in the lazy stage chunk.
- All 127 tests pass, including all 30 subject assignments and a check that changing an answer cannot change the submission art/public prompt.
- Browser: Venus question correctly shows Venus despite referencing Earth; art remains through answer reveal. No console errors. At a 320 px viewport the document has no horizontal overflow and the art stays within the existing 68 px scene. Desktop stage retains its existing dimensions.
- Reduced motion is handled in CSS; operating-system reduced-motion behavior and slow-device frame timing have not yet been manually measured. Full cross-game visual audit belongs to iteration 5.

## Iteration 2 verification — 2026-09-21

- Production build and all 129 tests pass. Coverage includes every fact and all generated tiers across three random inputs, plus answer privacy and explicit spoiler-sensitive mappings.
- Initial bundle stays at 513.47 kB raw (estimated transfer 145.86 kB versus 145.85 kB). Lazy stage is now 30.68 kB raw / 10.33 kB estimated transfer, an increase of 5.36 kB over iteration 1. This slightly exceeds the 5 kB target to cover all 126 remaining cards/templates in one release; it adds no image downloads, libraries or initial art payload. The existing initial-size and CommonJS warnings remain.
- Reviewed all 63 new drawings in a temporary contact sheet; corrected pale-on-dark linework and sloth/bear detail. The review page was removed before the final build and is absent from production output.
- Browser: Wildlife panda, Earth rotation/ocean pressure and Quantities robot/photo scenes render against their actual questions. Submission, timeout reveal and round transitions work. At 320 px the document has no horizontal overflow, the art remains 68 px tall, and a new subject uses only five SVG descendant elements. Entrance animation reports one iteration and settles at full opacity. No runtime errors in the fresh gameplay test tab.
- Reduced-motion CSS includes an explicit override for every motion variant. Actual OS preference switching and low-end-device frame-time measurements remain part of iteration 5.

## Iteration 3 verification — 2026-09-22

- 42 new path drawings plus the Pick console. Visually reviewed all new subjects using an in-memory local contact sheet (no shipped gallery or assets).
- Production build passes. Initial payload remains 513.47 kB raw / 145.86 kB estimated transfer. Lazy stage is 42.89 kB raw / 14.30 kB transfer, a 3.97 kB increase over iteration 2. No new dependencies or image requests. Existing initial-budget/CommonJS warnings remain.
- All 133 tests passed; the six art tests and production build passed again after the final neutral multiplayer-reveal refinement. Coverage checks all Human scenarios and both sides of every Majority prompt, unchanged art under Human answer/role changes and Majority submissions, and secret-target exclusion during Pick submission.
- Browser: Human language scenario uses speech art. Solo Pick displays the public lower hint with its target still hidden. Two-player Majority karaoke/golf art matches A/B options through a split reveal and scoring. At 320 px the art slots are both 127.5 × 68 px, with no horizontal overflow. Multiplayer Pick displays a lock and `?` after one submission, then the revealed target after both submit. No runtime errors in the fresh test tab.
- Full OS reduced-motion and low-end-device frame timing remain in iteration 5. Game mechanics, timing, scoring, audio and card selection are unchanged.

## Iteration 4 verification — 2026-09-22

- Production build and all 135 tests pass. Secret-swapping checks cover opposing private roles, words, codewords and unpublished votes; reveal tests cover caught, escaped, void and results states plus new-round reset.
- Initial payload remains 513.47 kB raw / 145.86 kB estimated transfer. Lazy stage is 53.71 kB raw / 16.79 kB transfer, an increase of 2.49 kB compressed. No dependencies or asset downloads added. Existing initial-budget/CommonJS warnings remain.
- Browser: two-player Restricted Clues giver/guesser views share the sealed vault, which opens at correct reveal. Three-player One of Us informed/bluffer views share the clue board through collection, discussion, voting and caught reveal. Three-player Infiltrator human/machine views share the terminal, anonymous cards and voting radar; correct votes reveal the machine, and the next round resets to transmission art. No errors in the host browser console.
- At a 320 px viewport, the One of Us stage remains 68 px tall and document/client widths both measure 305 px (no horizontal overflow). Mobile ballot and desktop vault/terminal illustrations visually reviewed. Viewport override reset afterward.
- Actual OS reduced-motion preference switching and low-end frame-time measurements remain in iteration 5. CSS includes reduced-motion overrides and preserves the opened vault state without animation.

## Iteration 5 verification — 2026-09-23

- All 135 tests pass after the final changes, including transport-level multiplayer/reconnection tests and explicit mapping regressions for the corrected Majority illustrations. The room-link client fix was verified separately in the browser.
- Production build passes; initial bundle 513.77 kB raw / 145.96 kB estimated transfer (+0.10 kB compressed versus iteration 4, from room recovery guards). Lazy game-stage 54.73 kB raw / 17.25 kB transfer (+0.46 kB); Pick 10.74 / 3.29 kB. Existing initial-budget and CommonJS warnings remain. No new dependencies, image URLs, bitmap downloads or runtime animation libraries.
- All seven game layouts reviewed at 320 px using real rooms. Sampled client/scroll widths both 305 px; stage remains 68 px tall. SVG descendants in sampled scenes: Estimate 5, Human 5, Majority 10, Pick 9, Restricted Clues 12, One of Us 9, Infiltrator 7. These are DOM complexity counts, not frame-rate benchmarks. Majority A/B slots remain equal at 127.5 × 68 px.
- Pick desktop/mobile submission and timeout reveal reviewed; number tiles no longer grow to desktop-width squares. Long nickname wraps without colliding with help. Estimate two-player exact/near reveal and long nickname, Human solo late-join spectator, all three deduction submission stages, and Infiltrator help open/Escape close verified. Earlier iteration 3/4 reveal and voting checks remain applicable; this pass changes no scoring/timing/role rules.
- Same-room refresh restores the player and round. Navigating that tab to a different existing room stays on the requested join screen and joins correctly, instead of reconnecting to the old room. Stale callbacks from a departed room are ignored and private view resets on attachment. Missing-room errors now remain on the join form instead of relying only on a disappearing toast.
- Source review confirms global reduced-motion animation/transition suppression, subject-specific overrides, and explicit static open-vault/lower-arrow end states. Decorative stage animations finish within 1.5 s; Pick's redundant endless radar pulse is now finite. Urgent timer motion remains functional feedback and is also disabled by reduced motion.
- **Validation limitation:** the available browser controller has viewport inspection but no OS motion-preference or CPU-throttling controls. Actual preference switching, physical low-end frame timing and a full low-end-device run are unmeasured. Do not present those checks as passed. No universal no-loading-impact or frame-rate guarantee is claimed.
