import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import {
  ref,
  query,
  orderByChild,
  onValue,
  push,
  set,
} from "firebase/database";
import { rtdb } from "../services/firebase"; // adjust path if needed

// Define the shape of a Match (as stored in Firebase and used in context)
export interface Match {
  id: string;
  player1: string;
  player2: string;
  rival1: string;
  rival2: string;
  result: string; // format: "X-Y" (e.g., "1-2")
  date: number; // timestamp (ms since epoch)
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

const MatchesContext = createContext<{
  matches: Match[];
  loading: boolean;
  error: Error | null;
  addMatch: (data: Omit<Match, "id">) => void;
  updateMatch: (match: Match) => void;
  removeMatch: (id: string) => void;
} | null>(null);

const matchesReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_MATCHES":
      return { ...state, matches: action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "ADD_MATCH": {
      const updatedList = [...state.matches, action.payload];
      updatedList.sort((a, b) => b.date - a.date); // keep newest first
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

  // Fetch all matches initially and listen for changes
  useEffect(() => {
    console.log("initilized");
    const matchesQuery = query(ref(rtdb, "/"), orderByChild("date"));
    const unsubscribe = onValue(
      matchesQuery,
      (snapshot) => {
        if (!snapshot.exists()) {
          dispatch({ type: "SET_MATCHES", payload: [] });
          return;
        }
        const allMatches: Match[] = [];
        snapshot.forEach((child) => {
          const data = child.val();
          const dateMs =
            typeof data.date === "number"
              ? data.date
              : new Date(data.date).getTime();
          allMatches.push({
            id: child.key || "", // use the Firebase key as id
            player1: data.player1,
            player2: data.player2,
            rival1: data.rival1,
            rival2: data.rival2,
            result: data.result, // e.g. "1-2"
            date: dateMs,
          });
        });
        // Show newest matches first
        dispatch({ type: "SET_MATCHES", payload: allMatches.reverse() });
      },
      (error) => {
        dispatch({ type: "SET_ERROR", payload: error });
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper to write the entire matches list to Firebase
  const commitToDatabase = async (matches: Match[]) => {
    const data: { [key: string]: Omit<Match, "id"> } = {};
    matches.forEach((m) => {
      const { id, ...fields } = m;
      data[id] = fields;
    });
    try {
      await set(ref(rtdb, "/"), data);
    } catch (err) {
      if (err instanceof Error) {
        dispatch({ type: "SET_ERROR", payload: err });
      }
    }
  };

  // Action: Add a new match
  const addMatch = (matchData: Omit<Match, "id">) => {
    const newId = push(ref(rtdb, "/")).key;
    if (!newId) return;
    const newMatch: Match = {
      id: newId,
      ...matchData,
      date:
        typeof matchData.date === "number" ? matchData.date : matchData.date,
    };
    dispatch({ type: "ADD_MATCH", payload: newMatch });
    commitToDatabase(
      [...state.matches, newMatch].sort((a, b) => b.date - a.date)
    );
  };

  // Action: Update an existing match
  const updateMatch = (updatedMatch: Match) => {
    dispatch({ type: "UPDATE_MATCH", payload: updatedMatch });
    const newList = state.matches.map((m) =>
      m.id === updatedMatch.id ? updatedMatch : m
    );
    commitToDatabase(newList.sort((a, b) => b.date - a.date));
  };

  // Action: Remove a match by id
  const removeMatch = (id: string) => {
    dispatch({ type: "REMOVE_MATCH", payload: id });
    const newList = state.matches.filter((m) => m.id !== id);
    commitToDatabase(newList);
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
