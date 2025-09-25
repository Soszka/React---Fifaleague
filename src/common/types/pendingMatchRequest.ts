import { MatchActivityActor, MatchActivityType } from "./matchActivity";

export type PendingMatchActionType = MatchActivityType;

export interface PendingMatchData {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string;
  date: number;
}

export type PendingMatchRequestPayload =
  | { type: "create"; match: PendingMatchData }
  | {
      type: "update";
      matchId: string;
      match: PendingMatchData;
      previousMatch?: PendingMatchData | null;
    }
  | { type: "delete"; matchId: string; match: PendingMatchData };

export interface PendingMatchRequestRecord {
  actor: MatchActivityActor;
  timestamp: number;
  payload: PendingMatchRequestPayload;
}

export interface PendingMatchRequest
  extends PendingMatchRequestRecord {
  id: string;
}
