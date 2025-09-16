import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { DataSnapshot, onValue, ref } from "firebase/database";
import { rtdb } from "../services/firebase";
import {
  MatchActivityLog,
  MatchActivityPayload,
  MatchActivityType,
} from "../types/matchActivity";

interface MatchActivityContextValue {
  activities: MatchActivityLog[];
  loading: boolean;
  error: Error | null;
}

const MatchActivityContext = createContext<MatchActivityContextValue | null>(
  null
);

const isActivityType = (value: unknown): value is MatchActivityType =>
  value === "create" || value === "update" || value === "delete";

const toTimestamp = (value: number | string) =>
  typeof value === "number" ? value : new Date(value).getTime();

const isMatchSnapshot = (
  value: unknown
): value is MatchActivityPayload["matchSnapshot"] => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.player1 === "string" &&
    typeof record.player2 === "string" &&
    typeof record.rival1 === "string" &&
    typeof record.rival2 === "string" &&
    typeof record.result === "string" &&
    (typeof record.date === "number" || typeof record.date === "string")
  );
};

const mapActivity = (
  id: string,
  child: DataSnapshot
): MatchActivityLog | null => {
  const value = child.val();
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (
    typeof record.matchId !== "string" ||
    !isActivityType(record.type) ||
    (typeof record.timestamp !== "number" && typeof record.timestamp !== "string")
  ) {
    return null;
  }

  const actorRaw = record.actor as Record<string, unknown> | undefined;
  const actorId =
    actorRaw && typeof actorRaw.id === "string" ? actorRaw.id : "unknown";
  const actorDisplayName =
    actorRaw && typeof actorRaw.displayName === "string"
      ? actorRaw.displayName
      : "Unknown";

  const snapshot = record.matchSnapshot;
  if (!isMatchSnapshot(snapshot)) {
    return null;
  }

  const snapshotRecord = snapshot as Record<string, unknown>;
  const matchId = snapshotRecord.id;

  return {
    id,
    matchId: typeof matchId === "string" ? matchId : record.matchId,
    type: record.type,
    timestamp: toTimestamp(record.timestamp as number | string),
    actor: {
      id: actorId,
      displayName: actorDisplayName,
    },
    matchSnapshot: {
      id: typeof matchId === "string" ? matchId : record.matchId,
      player1: snapshot.player1,
      player2: snapshot.player2,
      rival1: snapshot.rival1,
      rival2: snapshot.rival2,
      result: snapshot.result,
      date: toTimestamp(snapshot.date),
    },
  };
};

export const MatchActivityProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activities, setActivities] = useState<MatchActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const activitiesRef = ref(rtdb, "/activityLogs");
    const unsubscribe = onValue(
      activitiesRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setActivities([]);
          setLoading(false);
          return;
        }

        const parsed: MatchActivityLog[] = [];
        snapshot.forEach((child) => {
          const mapped = mapActivity(child.key ?? "", child);
          if (mapped) {
            parsed.push(mapped);
          }
          return false;
        });
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setActivities(parsed);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <MatchActivityContext.Provider value={{ activities, loading, error }}>
      {children}
    </MatchActivityContext.Provider>
  );
};

export const useMatchActivity = () => {
  const context = useContext(MatchActivityContext);
  if (!context) {
    throw new Error(
      "useMatchActivity must be used within a MatchActivityProvider"
    );
  }
  return context;
};
