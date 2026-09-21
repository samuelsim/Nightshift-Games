import type { EstimateArtSubject } from './estimate.types';

// Explicit content-ID assignments. Intentionally no labelled layers, tilt angles,
// thermometers, ocean boundaries or proportional cross-sections to solve a question.
export const earthArt = {
  'earth-layers':'earth', 'other-gases':'atmosphere', 'water-boil':'steam',
  'ridge-submerged':'seafloor', 'land-crust':'earth', 'ocean-crust':'seafloor',
  'earth-spin':'earth', 'sunlight-earth':'earth', 'core-temperature':'earth',
  'outer-core':'earth', 'ridge-length':'seafloor', 'ocean-age':'ocean',
  'water-share':'ocean', 'named-oceans':'ocean', 'salt':'ocean',
  'sunlight-zone':'ocean', 'nitrogen':'atmosphere', 'fresh-freeze':'ice',
  'mean-depth':'ocean', 'pressure-step':'ocean', 'twilight-bottom':'ocean',
  'challenger':'seafloor', 'axial-tilt':'earth', 'ocean-volume':'ocean',
  'salt-freeze':'ice', 'hadal':'seafloor', 'mantle':'earth',
  'ion-share':'ocean', 'fresh-dense':'water', 'southern-boundary':'ocean'
} as const satisfies Record<string, EstimateArtSubject>;
