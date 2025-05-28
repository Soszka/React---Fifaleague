export type Order = "asc" | "desc";

export type ResultOption = "WIN" | "LOSS" | "DRAW";

export type FilterResultOption = ResultOption | "";

export interface RowData {
  id: string;
  team: string;
  rival: string;
  score: string;
  outcome: ResultOption;
  date: number;
}
