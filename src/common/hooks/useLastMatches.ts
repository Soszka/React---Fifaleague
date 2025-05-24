import { useEffect, useState } from "react";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
} from "firebase/database";
import { rtdb } from "../services/firebase";

interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string;
  date: string;
}

export interface MatchUi {
  team1: string;
  score: string;
  team2: string;
}

export const useLastMatches = (howMany = 10) => {
  const [matches, setMatches] = useState<MatchUi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const q = query(ref(rtdb, "/"), orderByChild("date"), limitToLast(howMany));
    const unsub = onValue(q, (snap) => {
      if (!snap.exists()) {
        setMatches([]);
        setLoading(false);
        return;
      }
      const list: MatchUi[] = [];
      snap.forEach((child) => {
        const m = child.val() as RawMatch;
        list.push({
          team1: `${m.player1} & ${m.player2}`,
          score: m.result.replace("-", " : "),
          team2: `${m.rival1} & ${m.rival2}`,
        });
      });
      setMatches(list.reverse());
      setLoading(false);
    });
    return () => unsub();
  }, [howMany]);

  return { matches, loading };
};
