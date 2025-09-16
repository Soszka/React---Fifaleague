export type MatchActivityType = "create" | "update" | "delete";

export interface MatchActivityActor {
  id: string;
  displayName: string;
}

export interface MatchActivityPayload {
  matchId: string;
  type: MatchActivityType;
  timestamp: number;
  actor: MatchActivityActor;
  matchSnapshot: {
    id: string;
    player1: string;
    player2: string;
    rival1: string;
    rival2: string;
    result: string;
    date: number;
  };
}

export interface MatchActivityLog extends MatchActivityPayload {
  id: string;
}
