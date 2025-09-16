import { useEffect, useState } from "react";
import { DataSnapshot, onValue, ref } from "firebase/database";
import { rtdb } from "../services/firebase";

interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string;
  date: string | number;
}

export interface MatchUi {
  team1: string;
  score: string;
  team2: string;
}

const MATCHES_COLLECTION_KEY = "matches";
const ACTIVITY_LOG_KEY = "activityLogs";

const isMatchRecord = (value: unknown): value is RawMatch => {
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

const normalizeDate = (value: string | number) =>
  typeof value === "number" ? value : new Date(value).getTime();

const formatScore = (value: string) =>
  value.includes(":") ? value : value.replace("-", " : ");

const mapChildToMatch = (
  child: DataSnapshot
): { key: string; match: MatchUi & { date: number } } | null => {
  const raw = child.val();
  if (!isMatchRecord(raw)) return null;
  const key = child.key ?? `${raw.player1}-${raw.player2}-${raw.date}`;
  return {
    key,
    match: {
      team1: `${raw.player1} & ${raw.player2}`,
      team2: `${raw.rival1} & ${raw.rival2}`,
      score: formatScore(raw.result),
      date: normalizeDate(raw.date),
    },
  };
};

const collectMatches = (snapshot: DataSnapshot): (MatchUi & { date: number })[] => {
  const matches = new Map<string, MatchUi & { date: number }>();
  const nested = snapshot.child(MATCHES_COLLECTION_KEY);

  if (nested.exists()) {
    nested.forEach((child) => {
      const mapped = mapChildToMatch(child);
      if (mapped) {
        matches.set(mapped.key, mapped.match);
      }
      return false;
    });
  }

  snapshot.forEach((child) => {
    if (child.key === ACTIVITY_LOG_KEY || child.key === MATCHES_COLLECTION_KEY) {
      return false;
    }
    const mapped = mapChildToMatch(child);
    if (mapped) {
      matches.set(mapped.key, mapped.match);
    }
    return false;
  });

  return Array.from(matches.values()).sort((a, b) => b.date - a.date);
};

export const useLastMatches = (howMany = 10) => {
  const [matches, setMatches] = useState<MatchUi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onValue(ref(rtdb), (snap) => {
      if (!snap.exists()) {
        setMatches([]);
        setLoading(false);
        return;
      }
      const all = collectMatches(snap).slice(0, howMany);
      setMatches(
        all.map(({ date: _date, ...rest }) => ({
          ...rest,
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [howMany]);

  return { matches, loading };
};
