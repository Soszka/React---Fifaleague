import { stripDiacritics } from "../utils/stringUtils";

export const PLAYER_LABELS = [
  "Adam",
  "Adrian",
  "Bartek",
  "Damian",
  "Darek",
  "Dominik",
  "Grzesiek R",
  "Grzesiek Ś",
  "Marek",
  "Michał",
  "Random",
  "Łukasz",
] as const;

export type PlayerLabel = (typeof PLAYER_LABELS)[number];

export interface PlayerInfo {
  id: string;
  label: PlayerLabel;
  email: string;
}

export const normalizePlayerId = (value: string): string =>
  stripDiacritics(value).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

export const PLAYERS: PlayerInfo[] = PLAYER_LABELS.map((label) => {
  const id = normalizePlayerId(label);
  return {
    id,
    label,
    email: `${id}@${id}.com`,
  };
});

const LABEL_BY_ID = new Map<string, PlayerLabel>(
  PLAYERS.map((player) => [player.id, player.label])
);

export const getPlayerLabel = (value: string): PlayerLabel | undefined => {
  const normalized = normalizePlayerId(value);
  return LABEL_BY_ID.get(normalized);
};

export const getPlayerInfoByLabel = (
  label: string
): PlayerInfo | undefined => PLAYERS.find((player) => player.label === label);
