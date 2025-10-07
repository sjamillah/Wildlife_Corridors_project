export const ALLOWED_SPECIES = [
  'Elephant',
  'Wildebeest'
];

export const isAllowedSpecies = (species) => {
  if (!species) return false;
  return ALLOWED_SPECIES.some(s => species.toLowerCase().includes(s.toLowerCase()));
};
