import { getPlayerLabel, normalizePlayerId, PLAYER_LABELS } from "../constants/players";
import { stripDiacritics as baseStripDiacritics } from "./stringUtils";

const FALLBACK_CAPITALIZE = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;

const LABEL_LOOKUP = new Map<string, string>();

PLAYER_LABELS.forEach((label) => {
  LABEL_LOOKUP.set(normalizePlayerId(label), label);
});

export const stripDiacritics = baseStripDiacritics;

export const formatDisplayName = (name: string): string => {
  const mapped = getPlayerLabel(name) ?? LABEL_LOOKUP.get(normalizePlayerId(name));
  return mapped ?? FALLBACK_CAPITALIZE(name);
};

export const restoreDiacritics = (value: string): string => formatDisplayName(value);
