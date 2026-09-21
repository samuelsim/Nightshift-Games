// Only whole-body radius/diameter questions receive a geometric guide.
// Never use a full-planet radius for an inner-core measurement question.
export const spaceMeasures: Readonly<Record<string, 'radius' | 'diameter' | undefined>> = {
  'earth-diameter':'diameter', 'moon-radius':'radius', 'jupiter-radius':'radius',
  'saturn-diameter':'diameter', 'sun-radius':'radius', 'mercury-radius':'radius',
  'neptune-diameter':'diameter'
};
