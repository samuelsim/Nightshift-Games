export interface SoundPalette { wave: OscillatorType; pitch: number; spacing: number; duration: number; level: number; victory: readonly number[]; }
const palettes: Record<string, SoundPalette> = {
  'human-infiltrator': {wave:'triangle',pitch:.8,spacing:.11,duration:.22,level:.7,victory:[330,494,659,988]},
  'estimate': {wave:'sine',pitch:1.25,spacing:.075,duration:.3,level:.8,victory:[659,784,988,1319]},
  'estimate-earth': {wave:'sine',pitch:.8,spacing:.12,duration:.36,level:.8,victory:[392,587,784,1175]},
  'estimate-wildlife': {wave:'triangle',pitch:1.4,spacing:.065,duration:.17,level:.65,victory:[784,1175,988,1568]},
  'estimate-facts': {wave:'sine',pitch:1.1,spacing:.14,duration:.4,level:.7,victory:[440,659,880,1319]},
  'pick-number': {wave:'triangle',pitch:1,spacing:.06,duration:.18,level:.75,victory:[392,523,659,784]},
  'restricted-clues': {wave:'sine',pitch:1.5,spacing:.1,duration:.16,level:.8,victory:[784,659,880,1047]},
  'human-exe': {wave:'square',pitch:1,spacing:.065,duration:.13,level:.28,victory:[523,1047,784,1568]},
  'majority-rules': {wave:'triangle',pitch:.9,spacing:.12,duration:.28,level:.75,victory:[392,494,587,784]},
  'one-of-us': {wave:'sine',pitch:.65,spacing:.16,duration:.38,level:.9,victory:[330,392,311,523]}
};
const fallback: SoundPalette = {wave:'sine',pitch:1,spacing:.085,duration:.24,level:1,victory:[523,659,784,1047]};
export function soundPalette(gameId: string | null): SoundPalette { return palettes[gameId ?? ''] ?? fallback; }
