import { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  onValue,
  DataSnapshot,
} from "firebase/database";
import { rtdb } from "../services/firebase";

interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string; // np. "5-3"
  date: string; // ISO-string albo timestamp zapisany jako string
}

export interface PlayerStats {
  lastResult: string;
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
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // poniedziałek
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return d >= monday && d < nextMonday;
};

/**
 * Hook pobierający statystyki konkretnego gracza na podstawie danych
 * z Firebase Realtime Database.
 *
 * @param player nazwa gracza (dokładnie tak jak w bazie)
 * @param dbPath ścieżka w RTDB zawierająca node z meczami (domyślnie root "/")
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
          weekMatches: 0,
          winPercent: 0,
          avgGoals: 0,
        });
        setLoading(false);
        return;
      }

      const all: RawMatch[] = [];
      snap.forEach((child) => {
        all.push(child.val() as RawMatch);
        // nie zwracamy wartości, żeby uniknąć błędu typu
      });

      const myMatches = all.filter((m) =>
        [m.player1, m.player2, m.rival1, m.rival2].includes(player)
      );

      if (!myMatches.length) {
        setStats({
          lastResult: "-",
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

      const weekMatches = myMatches.filter((m) =>
        sameCalendarWeek(new Date(m.date))
      );

      let wins = 0;
      let goals = 0;

      myMatches.forEach((m) => {
        const { home, away } = parseScore(m.result);
        const isHome = [m.player1, m.player2].includes(player);
        const myGoals = isHome ? home : away;
        const rivalGoals = isHome ? away : home;
        goals += myGoals;
        if (myGoals > rivalGoals) wins += 1;
      });

      setStats({
        lastResult,
        weekMatches: weekMatches.length,
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
