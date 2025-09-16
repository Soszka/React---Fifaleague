import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import {
  DataSnapshot,
  onValue,
  push,
  ref,
  remove,
  set,
} from "firebase/database";
import { rtdb } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { restoreDiacritics } from "../utils/nameUtils";
import {
  MatchActivityPayload,
  MatchActivityType,
} from "../types/matchActivity";

export interface Match {
  id: string;
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string;
  date: number;
}

interface State {
  matches: Match[];
  loading: boolean;
  error: Error | null;
}

type Action =
  | { type: "SET_MATCHES"; payload: Match[] }
  | { type: "SET_ERROR"; payload: Error }
  | { type: "ADD_MATCH"; payload: Match }
  | { type: "UPDATE_MATCH"; payload: Match }
  | { type: "REMOVE_MATCH"; payload: string };

const initialState: State = {
  matches: [],
  loading: true,
  error: null,
};

const MATCHES_COLLECTION_KEY = "matches";
const ACTIVITY_LOG_KEY = "activityLogs";
const ACTIVITY_LOG_PATH = `/${ACTIVITY_LOG_KEY}`;

const isMatchRecord = (value: unknown): value is Omit<Match, "id"> => {
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

const normalizeDate = (value: number | string) =>
  typeof value === "number" ? value : new Date(value).getTime();

const toMatch = (id: string, value: Omit<Match, "id">): Match => ({
  id,
  player1: value.player1,
  player2: value.player2,
  rival1: value.rival1,
  rival2: value.rival2,
  result: value.result,
  date: normalizeDate(value.date),
});

const ensureError = (err: unknown, fallbackMessage: string) =>
  err instanceof Error ? err : new Error(fallbackMessage);

const extractMatches = (snapshot: DataSnapshot): Match[] => {
  const matches = new Map<string, Match>();
  const nested = snapshot.child(MATCHES_COLLECTION_KEY);

  const appendMatch = (child: DataSnapshot) => {
    const val = child.val();
    if (isMatchRecord(val)) {
      const id = child.key ?? "";
      matches.set(id, toMatch(id, val));
    }
  };

  if (nested.exists()) {
    nested.forEach((child) => {
      appendMatch(child);
      return false;
    });
  }

  snapshot.forEach((child) => {
    if (child.key === ACTIVITY_LOG_KEY || child.key === MATCHES_COLLECTION_KEY) {
      return false;
    }
    appendMatch(child);
    return false;
  });

  return Array.from(matches.values()).sort((a, b) => b.date - a.date);
};

const matchToPayload = (match: Match): Omit<Match, "id"> => ({
  player1: match.player1,
  player2: match.player2,
  rival1: match.rival1,
  rival2: match.rival2,
  result: match.result,
  date: match.date,
});

const MatchesContext = createContext<{
  matches: Match[];
  loading: boolean;
  error: Error | null;
  addMatch: (data: Omit<Match, "id">) => Promise<void>;
  updateMatch: (match: Match) => Promise<void>;
  removeMatch: (id: string) => Promise<void>;
} | null>(null);

const matchesReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_MATCHES":
      return { ...state, matches: action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_MATCH": {
      const updatedList = [...state.matches, action.payload];
      updatedList.sort((a, b) => b.date - a.date);
      return { ...state, matches: updatedList };
    }
    case "UPDATE_MATCH": {
      const updatedList = state.matches.map((m) =>
        m.id === action.payload.id ? action.payload : m
      );
      updatedList.sort((a, b) => b.date - a.date);
      return { ...state, matches: updatedList };
    }
    case "REMOVE_MATCH": {
      const updatedList = state.matches.filter((m) => m.id !== action.payload);
      return { ...state, matches: updatedList };
    }
    default:
      return state;
  }
};

export const MatchesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(matchesReducer, initialState);
  const { user } = useAuth();

  const actorEmailName = user?.email?.split("@")[0] ?? "";
  const actorDisplayName = actorEmailName
    ? restoreDiacritics(actorEmailName)
    : "Unknown";
  const actorId = user?.uid ?? (actorEmailName || "unknown");

  useEffect(() => {
    const unsubscribe = onValue(
      ref(rtdb),
      (snapshot) => {
        if (!snapshot.exists()) {
          dispatch({ type: "SET_MATCHES", payload: [] });
          return;
        }

        const parsedMatches = extractMatches(snapshot);
        dispatch({ type: "SET_MATCHES", payload: parsedMatches });
      },
      (error) => {
        dispatch({ type: "SET_ERROR", payload: error });
      }
    );

    return () => unsubscribe();
  }, []);

  const logActivity = async (
    type: MatchActivityType,
    match: Match
  ): Promise<void> => {
    const payload: MatchActivityPayload = {
      matchId: match.id,
      type,
      timestamp: Date.now(),
      actor: {
        id: actorId,
        displayName: actorDisplayName,
      },
      matchSnapshot: {
        ...match,
      },
    };

    const logRef = push(ref(rtdb, ACTIVITY_LOG_PATH));
    await set(logRef, payload);
  };

  const addMatch = async (matchData: Omit<Match, "id">): Promise<void> => {
    const newRef = push(ref(rtdb, "/"));
    const newId = newRef.key;

    if (!newId) {
      const error = new Error("Unable to generate match identifier");
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }

    const newMatch: Match = {
      id: newId,
      ...matchData,
      date: normalizeDate(matchData.date),
    };

    dispatch({ type: "ADD_MATCH", payload: newMatch });

    try {
      await set(newRef, matchToPayload(newMatch));
    } catch (err) {
      const error = ensureError(err, "Failed to add match");
      dispatch({ type: "REMOVE_MATCH", payload: newId });
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }

    try {
      await logActivity("create", newMatch);
    } catch (err) {
      const error = ensureError(err, "Failed to log match creation");
      await remove(newRef);
      dispatch({ type: "REMOVE_MATCH", payload: newId });
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }
  };

  const updateMatch = async (updatedMatch: Match): Promise<void> => {
    const current = state.matches.find((m) => m.id === updatedMatch.id);
    const matchRef = ref(rtdb, `/${updatedMatch.id}`);

    dispatch({ type: "UPDATE_MATCH", payload: updatedMatch });

    try {
      await set(matchRef, matchToPayload(updatedMatch));
    } catch (err) {
      const error = ensureError(err, "Failed to update match");
      if (current) {
        dispatch({ type: "UPDATE_MATCH", payload: current });
      }
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }

    try {
      await logActivity("update", updatedMatch);
    } catch (err) {
      const error = ensureError(err, "Failed to log match update");
      if (current) {
        await set(matchRef, matchToPayload(current));
        dispatch({ type: "UPDATE_MATCH", payload: current });
      }
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }
  };

  const removeMatch = async (id: string): Promise<void> => {
    const existing = state.matches.find((m) => m.id === id);
    if (!existing) return;

    const matchRef = ref(rtdb, `/${id}`);

    dispatch({ type: "REMOVE_MATCH", payload: id });

    try {
      await remove(matchRef);
    } catch (err) {
      const error = ensureError(err, "Failed to delete match");
      dispatch({ type: "ADD_MATCH", payload: existing });
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }

    try {
      await logActivity("delete", existing);
    } catch (err) {
      const error = ensureError(err, "Failed to log match removal");
      await set(matchRef, matchToPayload(existing));
      dispatch({ type: "ADD_MATCH", payload: existing });
      dispatch({ type: "SET_ERROR", payload: error });
      throw error;
    }
  };

  return (
    <MatchesContext.Provider
      value={{
        matches: state.matches,
        loading: state.loading,
        error: state.error,
        addMatch,
        updateMatch,
        removeMatch,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
};

export const useMatches = () => {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error("useMatches must be used within a MatchesProvider");
  }
  return context;
};
