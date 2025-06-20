export const stripDiacritics = (str: string): string =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const specialNames: Record<string, string> = {
  lukasz: 'Łukasz',
  michal: 'Michał',
};

export const formatDisplayName = (name: string): string => {
  const key = stripDiacritics(name).toLowerCase();
  if (specialNames[key]) return specialNames[key];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};
