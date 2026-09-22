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

### 4 — Restricted Clues, One of Us, Infiltrator

Public phase sprites for listening, clue collection, suspicion, voting and reveal. Never derive public art from secret words, hidden roles, codewords or private directives. Word-specific reveal art only after public disclosure. Test two-player views with opposing roles.

### 5 — Integration and visual QA

Review all seven games, transitions and decks; long text, reconnect, late join, spectators, reduced motion and mobile. Record compressed bundle growth, DOM complexity and absence of added asset requests. Compare question-to-art coverage against source content; do not claim full bespoke question coverage until the audit is complete.

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
