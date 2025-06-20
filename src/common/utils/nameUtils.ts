const specialNames: Record<string, string> = {
  lukasz: "Łukasz",
  michal: "Michał",
};

export const formatDisplayName = (name: string): string => {
  const key = stripDiacritics(name).toLowerCase();
  if (specialNames[key]) return specialNames[key];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export const stripDiacritics = (value: string): string => {
  const map: Record<string, string> = {
    Ą: "A",
    Ć: "C",
    Ę: "E",
    Ł: "L",
    Ń: "N",
    Ó: "O",
    Ś: "S",
    Ź: "Z",
    Ż: "Z",
    ą: "a",
    ć: "c",
    ę: "e",
    ł: "l",
    ń: "n",
    ó: "o",
    ś: "s",
    ź: "z",
    ż: "z",
  };

  return value
    .normalize("NFD") // usuń łączone znaki (ą → a + ˛)
    .replace(/[\u0300-\u036f]/g, "") // skasuj znaczniki diakrytyczne
    .split("")
    .map((c) => map[c] ?? c) // podmień znaki, których NFD nie rozłoży (ł, Ł)
    .join("");
};

const DIACRITICS_MAP: Record<string, string> = {
  lukasz: "Łukasz",
  michal: "Michał",
};

export const restoreDiacritics = (value: string): string => {
  const lower = value.toLowerCase();
  return (
    DIACRITICS_MAP[lower] ?? value.charAt(0).toUpperCase() + value.slice(1)
  );
};
