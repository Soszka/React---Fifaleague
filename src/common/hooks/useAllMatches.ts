import { useEffect, useState } from "react";
import { ref, query, orderByChild, onValue } from "firebase/database";
import { rtdb } from "../services/firebase";

export interface RawMatch {
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string;
  date: string;
}

export interface MatchUi {
  team1: string;
  team2: string;
  score: string;
}

export const useAllMatches = () => {
  const [matches, setMatches] = useState<MatchUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(ref(rtdb, "/"), orderByChild("date"));
    const unsub = onValue(
      q,
      (snap) => {
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
            team2: `${m.rival1} & ${m.rival2}`,
            score: m.result.replace("-", " : "),
          });
        });
        setMatches(list.reverse()); // najnowsze na górze
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { matches, loading, error };
};
