# Replayability and fidelity: increment 1

Daily challenges are complete; custom decks remain on hold. This increment expands the two
games with the most immediate content limitations without changing their timers or scoring.

## Estimate

Four selectable topics: generated Quantities, Space Facts, Earth & Ocean and Wildlife.
The three factual decks each have eighteen cards, six per difficulty, for 54 sourced cards.
Each session draws five distinct questions from the selected tier. Daily play now has twelve
independent topic/tier sets; existing Quantities and Space Facts v1 sequences are unchanged.
Regular and daily records distinguish the new decks. Sources remain hidden until reveal.

Earth & Ocean covers depth, salinity, atmosphere, ocean zones and physical quantities.
Wildlife covers speed, diets, sleep, reproduction and body measurements. Wording distinguishes
upper ends of ranges, animal species, human-care observations, units and rounded estimates.
New cards were reviewed against primary sources on 2026-09-16:

- NOAA: [ocean water](https://oceanservice.noaa.gov/facts/oceanwater.html), [depth](https://oceanservice.noaa.gov/facts/oceandepth.html), [named oceans](https://oceanservice.noaa.gov/facts/howmanyoceans.html), [salinity](https://oceanservice.noaa.gov/facts/whysalty.html), [light zones](https://oceanservice.noaa.gov/facts/light_travel.html), [pressure](https://oceanservice.noaa.gov/facts/pressure.html), [freezing](https://oceanservice.noaa.gov/facts/oceanfreeze.html).
- [NASA Earth facts](https://science.nasa.gov/earth/facts/).
- Smithsonian National Zoo: [cheetah](https://nationalzoo.si.edu/animals/cheetah), [Komodo dragon](https://nationalzoo.si.edu/animals/komodo-dragon), [giant panda](https://nationalzoo.si.edu/animals/giant-panda), [red panda](https://nationalzoo.si.edu/animals/red-panda), [two-toed sloth](https://nationalzoo.si.edu/animals/two-toed-sloth), [sloth bear](https://nationalzoo.si.edu/animals/sloth-bear).

Topic illustrations add a ringed planet and cratered moon, globe and fish, or paw and leaves.
Arrival/reveal animations respect reduced motion. Each factual topic has a distinct bounded
synth palette; urgency cues retain their consistent timing. Audio remains opt-in and muted in
hidden tabs. Hardware audibility cannot be established by automated oscillator tests.

## Human.exe

Twenty new authored situations bring the pool to 28. New situations have four options,
including two decoys; the original eight have three. Answer positions shuffle every game,
with HUMAN/MACHINE indices remapped before scoring. Solo still identifies both responses in
15 seconds; multiplayer still follows a private directive. These are playful authored
classifications, not a test of whether someone is human.

The room remembers the last fifteen presented questions and excludes them when preparing
the next five-question game. History lasts for that room only. An abandoned game remembers
only the questions already presented, not its unrevealed deck.

## Delivery boundaries

Validation: 94 tests pass across eleven suites, including transport-level daily rollover,
multiplayer flows, recently presented Human.exe questions across eight abandoned games,
all twelve daily sets, shuffled answer remapping, source privacy, record separation, and audio
opt-in/countdown behavior. Production build and workspace typecheck pass; existing qrcode/ws
CommonJS warnings remain. New question markers are absent from production browser JavaScript.

Browser checks verified Wildlife and Earth & Ocean daily rounds with exact guesses, 1,000-point
reveals, source links, topic graphics and election labels. Human.exe correctly scored both
assignments with a MACHINE answer shuffled into position four (270 points including speed).
Fixed a development-only schema import error by exposing the room model through a browser-safe
protocol entry point, and updated singular/plural decoy guidance. No new gameplay console
errors appeared after the restart. Mobile layout and hardware audio listening remain outside
this increment's browser verification.

This increment covers daily completion, Estimate topics, Human.exe variety and matching
presentation. The next increment should broaden other games' authored pools, revisit their
interaction feedback, and complete a wider documentation/fidelity audit. This file does not
claim those later items are finished. Custom decks remain excluded.
