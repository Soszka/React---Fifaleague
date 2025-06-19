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

interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string; // np. "5-3"
  date: string; // ISO‑string albo timestamp zapisany jako string
}

export interface PlayerStats {
  lastResult: string; // np. "5 : 3"
  lastOutcome: ResultOption; // "WIN" | "DRAW" | "LOSS"
  weekMatches: number;
  winPercent: number;
  avgGoals: number;
}

const parseScore = (score: string) => {
  const [home, away] = score.split("-").map((n) => parseInt(n.trim(), 10));
  return { home, away };
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
          lastOutcome: "DRAW",
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
          lastOutcome: "DRAW",
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      myMatches.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const lastMatch = myMatches[0];
      const lastResult = lastMatch.result.replace("-", " : ");

      const weekMatchesArr = myMatches.filter((m) =>
        sameCalendarWeek(new Date(m.date))
      );

      let wins = 0;
      let goals = 0;

      myMatches.forEach((m) => {
        const { home, away } = parseScore(m.result);
        const isHome = [m.player1, m.player2].some((n) => eq(n, player));
        const myGoals = isHome ? home : away;
        const rivalGoals = isHome ? away : home;
        goals += myGoals;
        if (myGoals > rivalGoals) wins += 1;
      });

      const { home: lastHome, away: lastAway } = parseScore(lastMatch.result);
      const isLastHome = [lastMatch.player1, lastMatch.player2].some((n) =>
        eq(n, player)
      );
      const myLastGoals = isLastHome ? lastHome : lastAway;
      const rivalLastGoals = isLastHome ? lastAway : lastHome;

      let lastOutcome: ResultOption = "DRAW";
      if (myLastGoals > rivalLastGoals) lastOutcome = "WIN";
      else if (myLastGoals < rivalLastGoals) lastOutcome = "LOSS";

      setStats({
        lastResult,
        lastOutcome,
        weekMatches: weekMatchesArr.length,
        winPercent: Math.round((wins / myMatches.length) * 100),
        avgGoals: parseFloat((goals / myMatches.length).toFixed(1)),
      });
      setLoading(false);
    };

    const unsub = onValue(q, handleSnap);
    return () => unsub();
  }, [player, dbPath]);

  return { stats, loading };
};
