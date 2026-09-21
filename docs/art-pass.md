# Question art rollout

## Priorities and acceptance gates

1. Performance: inline, code-native SVG for small illustrations. No image downloads, fonts, canvas loops, animation library or network requests. Target less than 5 kB compressed added JavaScript per iteration; measure production output. Render only the active subject. No endless animation; entrance motion ends within 1.5 seconds.
2. Readability: replace the existing stage rather than add question panels. Preserve its 90 px desktop / 68 px mobile scene, leave controls and question typography intact, hide decorative art from assistive technology, and honor reduced motion. Verify 320 px and desktop layouts.
3. Correctness: author subjects in content data, never infer them by matching arbitrary question text. Missing art keeps the existing game stage. Art is schematic, with no answer-derived counts, scales, measured angles or sizes. Hidden-word and role games must use public phase art until information is revealed to everyone.

## Iterations

### 1 — Foundation and Estimate space (implemented)

Ten original SVG subjects cover all 30 space cards: Sun, Moon and eight planets. Each card carries an optional typed `art` key assigned by its authored subject. Questions comparing Mars with Earth therefore show Mars; lunar samples show the Moon. Other decks retain existing visuals. Art replaces stage props and mascot during these questions, persists into reveal, and re-enters only on a new round/question. No gameplay, timing, daily seed, scoring or answer changes. These are shared subject illustrations, not yet individually bespoke compositions for every question.

### 2 — Estimate content coverage

Author species-specific wildlife illustrations, Earth/ocean scenes and everyday-maths objects. Add question-specific props where they do not hint at answers. Audit every generated template, every topic and difficulty. Explicitly distinguish radius/diameter imagery without supplying a numerical scale; avoid drawing the counted objects in count questions. Track covered card IDs/templates and keep uncovered cards on the fallback.

### 3 — Human.exe, Majority Rules, Pick a Number

Human.exe: scenario props with neutral expressions that cannot imply the correct response. Majority: balanced illustrations for both choices, with equal visual prominence. Pick: original solo radar and multiplayer draw states, and short lock/reveal/win reactions. Keep existing audio feedback and avoid multiple competing animations.

### 4 — Restricted Clues, One of Us, Infiltrator

Public phase sprites for listening, clue collection, suspicion, voting and reveal. Never derive public art from secret words, hidden roles, codewords or private directives. Word-specific reveal art only after public disclosure. Test two-player views with opposing roles.

### 5 — Integration and visual QA

Review all seven games, transitions and decks; long text, reconnect, late join, spectators, reduced motion and mobile. Record compressed bundle growth, DOM complexity and absence of added asset requests. Compare question-to-art coverage against source content; do not claim full bespoke question coverage until the audit is complete.

## Extension contract

For now `EstimateArtSubject` is the small explicit subject vocabulary. Add a subject to that type, render it in `QuestionArtComponent`, and assign it in authored content. Public projection must continue excluding answers/explanations/sources until reveal. If future games share subjects, move the vocabulary to a browser-safe shared model; do not import server content into the browser. Use per-game lazy bundles if cumulative art exceeds the initial payload budget.

## Iteration 1 verification — 2026-09-21

- Production build passes. Complete lazy game-stage chunk is 17.17 kB raw / 4.97 kB estimated transfer, including existing stage artwork. This is the total chunk, not a measured before/after delta. Initial bundle reports 513.47 kB and a 500 kB budget warning; question art is in the lazy stage chunk.
- All 127 tests pass, including all 30 subject assignments and a check that changing an answer cannot change the submission art/public prompt.
- Browser: Venus question correctly shows Venus despite referencing Earth; art remains through answer reveal. No console errors. At a 320 px viewport the document has no horizontal overflow and the art stays within the existing 68 px scene. Desktop stage retains its existing dimensions.
- Reduced motion is handled in CSS; operating-system reduced-motion behavior and slow-device frame timing have not yet been manually measured. Full cross-game visual audit belongs to iteration 5.
