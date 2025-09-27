import { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  onValue,
  DataSnapshot,
} from "firebase/database";
import { rtdb } from "../services/firebase";
import { ResultOption } from "../../pages/matches/types";
import { normalizeDateValue } from "../utils/dateUtils";

interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string; // np. "5-3"
  date: number | string; // ISO‑string albo timestamp zapisany jako string
}

export interface PlayerStats {
  lastResult: string; // np. "5 : 3"
  lastOutcome: ResultOption | null;
  weekMatches: number;
  winPercent: number;
  avgGoals: number;
}

const parseScore = (score: string) => {
  const [homeRaw = "", awayRaw = ""] = score
    .split(/[:\-]/)
    .map((n) => n.trim());
  const home = Number(homeRaw);
  const away = Number(awayRaw);

  if (Number.isNaN(home) || Number.isNaN(away)) {
    return null;
  }

  return { home, away };
};

const formatScore = (score: string) => {
  const [home = "", away = ""] = score
    .split(/[:\-]/)
    .map((n) => n.trim());

  if (!home || !away) {
    return score;
  }

  return `${home} : ${away}`;
};

const sameCalendarWeek = (d: Date) => {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return d >= monday && d < nextMonday;
};

const eq = (a?: string, b?: string) =>
  (a || "").toLowerCase() === (b || "").toLowerCase();

/**
 * Hook pobierający statystyki konkretnego gracza (case‑insensitive).
 * @param player nazwa gracza (dowolna wielkość liter)
 * @param dbPath ścieżka w RTDB (domyślnie "/")
 */
export const usePlayerStats = (player: string, dbPath: string = "/") => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(ref(rtdb, dbPath), orderByChild("date"));

    const handleSnap = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        setStats({
          lastResult: "-",
          lastOutcome: null,
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      const all: RawMatch[] = [];
      snap.forEach((child: DataSnapshot) => {
        all.push(child.val() as RawMatch);
      });

      // --- filtrowanie uczestnictwa (case‑insensitive) ---
      const myMatches = all.filter((m) =>
        [m.player1, m.player2, m.rival1, m.rival2].some((n) => eq(n, player))
      );

      if (!myMatches.length) {
        setStats({
          lastResult: "-",
          lastOutcome: null,
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      const matchesWithDates = [...myMatches]
        .map((match) => ({
          match,
          dateValue: normalizeDateValue(match.date),
        }))
        .sort((a, b) => {
          const aVal = Number.isFinite(a.dateValue) ? a.dateValue : -Infinity;
          const bVal = Number.isFinite(b.dateValue) ? b.dateValue : -Infinity;
          return bVal - aVal;
        });

      const lastMatchEntry = matchesWithDates.find((entry) =>
        Number.isFinite(entry.dateValue)
      );

      if (!lastMatchEntry) {
        setStats({
          lastResult: "-",
          lastOutcome: null,
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      const { match: lastMatch } = lastMatchEntry;
      const parsedLastScore = parseScore(lastMatch.result);

      if (!parsedLastScore) {
        setStats({
          lastResult: "-",
          lastOutcome: null,
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      const weekMatchesCount = matchesWithDates.filter((entry) => {
        if (!Number.isFinite(entry.dateValue)) {
          return false;
        }
        return sameCalendarWeek(new Date(entry.dateValue));
      }).length;

      let wins = 0;
      let goals = 0;
      let countedMatches = 0;

      myMatches.forEach((m) => {
        const parsed = parseScore(m.result);
        if (!parsed) {
          return;
        }
        countedMatches += 1;
        const isHome = [m.player1, m.player2].some((n) => eq(n, player));
        const myGoals = isHome ? parsed.home : parsed.away;
        const rivalGoals = isHome ? parsed.away : parsed.home;
        goals += myGoals;
        if (myGoals > rivalGoals) wins += 1;
      });

        if (!countedMatches) {
          setStats({
            lastResult: "-",
            lastOutcome: null,
            weekMatches: 0,
            winPercent: 0,
            avgGoals: 0,
          });
          setLoading(false);
          return;
        }

      const isLastHome = [lastMatch.player1, lastMatch.player2].some((n) =>
        eq(n, player)
      );
      const myLastGoals = isLastHome ? parsedLastScore.home : parsedLastScore.away;
      const rivalLastGoals = isLastHome
        ? parsedLastScore.away
        : parsedLastScore.home;

      let lastOutcome: ResultOption = "DRAW";
      if (myLastGoals > rivalLastGoals) lastOutcome = "WIN";
      else if (myLastGoals < rivalLastGoals) lastOutcome = "LOSS";

      setStats({
        lastResult: formatScore(lastMatch.result),
        lastOutcome,
        weekMatches: weekMatchesCount,
        winPercent: Math.round((wins / countedMatches) * 100),
        avgGoals: parseFloat((goals / countedMatches).toFixed(1)),
      });
      setLoading(false);
    };

    const unsub = onValue(q, handleSnap);
    return () => unsub();
  }, [player, dbPath]);

  return { stats, loading };
};
