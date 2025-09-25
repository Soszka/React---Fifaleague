import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { DataSnapshot, onValue, ref, remove } from "firebase/database";
import { rtdb } from "../services/firebase";
import { useAuth } from "./AuthContext";
import { normalizePlayerId } from "../constants/players";
import { restoreDiacritics } from "../utils/nameUtils";
import {
  PendingMatchRequest,
  PendingMatchRequestRecord,
} from "../types/pendingMatchRequest";
import { useMatches, Match, MatchActionResult } from "./MatchesContext";

const PENDING_MATCHES_PATH = "/pendingMatchRequests";

type PendingMatchesContextValue = {
  requests: PendingMatchRequest[];
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  approveRequest: (request: PendingMatchRequest) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
};

const PendingMatchesContext = createContext<PendingMatchesContextValue | null>(
  null
);

const isPendingRequestRecord = (
  value: unknown
): value is PendingMatchRequestRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const actor = record.actor as Record<string, unknown> | undefined;
  const payload = record.payload as Record<string, unknown> | undefined;

  if (
    !actor ||
    typeof actor.id !== "string" ||
    typeof actor.displayName !== "string" ||
    typeof record.timestamp !== "number" ||
    !payload ||
    typeof payload.type !== "string"
  ) {
    return false;
  }

  if (payload.type === "create") {
    const match = payload.match as Record<string, unknown> | undefined;
    return (
      !!match &&
      typeof match.player1 === "string" &&
      typeof match.player2 === "string" &&
      typeof match.rival1 === "string" &&
      typeof match.rival2 === "string" &&
      typeof match.result === "string" &&
      typeof match.date === "number"
    );
  }

  if (payload.type === "update") {
    const match = payload.match as Record<string, unknown> | undefined;
    const previous =
      payload.previousMatch as Record<string, unknown> | undefined;
    return (
      typeof payload.matchId === "string" &&
      !!match &&
      typeof match.player1 === "string" &&
      typeof match.player2 === "string" &&
      typeof match.rival1 === "string" &&
      typeof match.rival2 === "string" &&
      typeof match.result === "string" &&
      typeof match.date === "number" &&
      (previous === undefined ||
        (previous &&
          typeof previous.player1 === "string" &&
          typeof previous.player2 === "string" &&
          typeof previous.rival1 === "string" &&
          typeof previous.rival2 === "string" &&
          typeof previous.result === "string" &&
          typeof previous.date === "number"))
    );
  }

  if (payload.type === "delete") {
    const match = payload.match as Record<string, unknown> | undefined;
    return (
      typeof payload.matchId === "string" &&
      !!match &&
      typeof match.player1 === "string" &&
      typeof match.player2 === "string" &&
      typeof match.rival1 === "string" &&
      typeof match.rival2 === "string" &&
      typeof match.result === "string" &&
      typeof match.date === "number"
    );
  }

  return false;
};

const parsePendingRequests = (snapshot: DataSnapshot): PendingMatchRequest[] => {
  const items: PendingMatchRequest[] = [];
  snapshot.forEach((child) => {
    const value = child.val();
    if (isPendingRequestRecord(value)) {
      const id = child.key ?? "";
      if (id) {
        items.push({ id, ...value });
      }
    }
    return false;
  });

  return items.sort((a, b) => b.timestamp - a.timestamp);
};

export const PendingMatchesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { addMatch, updateMatch, removeMatch } = useMatches();

  const [requests, setRequests] = useState<PendingMatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const actorEmailName = user?.email?.split("@")[0] ?? "";
  const actorDisplayName = actorEmailName
    ? restoreDiacritics(actorEmailName)
    : "Unknown";
  const isAdmin =
    normalizePlayerId(actorDisplayName) === normalizePlayerId("Bartek");

  useEffect(() => {
    const pendingRef = ref(rtdb, PENDING_MATCHES_PATH);
    const unsubscribe = onValue(
      pendingRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRequests([]);
          setLoading(false);
          return;
        }
        const parsed = parsePendingRequests(snapshot);
        setRequests(parsed);
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

  const ensureAdmin = useCallback(() => {
    if (!isAdmin) {
      throw new Error("Only administrator can manage pending matches");
    }
  }, [isAdmin]);

  const removePending = useCallback(async (id: string) => {
    await remove(ref(rtdb, `${PENDING_MATCHES_PATH}/${id}`));
  }, []);

  const approveRequest = useCallback(async (
    request: PendingMatchRequest
  ): Promise<void> => {
    ensureAdmin();
    const payload = request.payload;
    try {
      let result: MatchActionResult = "completed";
      if (payload.type === "create") {
        result = await addMatch(payload.match);
      } else if (payload.type === "update") {
        const match: Match = { id: payload.matchId, ...payload.match };
        result = await updateMatch(match);
      } else if (payload.type === "delete") {
        result = await removeMatch(payload.matchId);
      }

      if (result === "queued") {
        throw new Error("Request could not be completed");
      }

      await removePending(request.id);
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Failed to approve pending match");
    }
  }, [ensureAdmin, addMatch, updateMatch, removeMatch, removePending]);

  const rejectRequest = useCallback(async (id: string): Promise<void> => {
    ensureAdmin();
    try {
      await removePending(id);
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Failed to reject pending match");
    }
  }, [ensureAdmin, removePending]);

  const value = useMemo(
    () => ({
      requests,
      loading,
      error,
      isAdmin,
      approveRequest,
      rejectRequest,
    }),
    [requests, loading, error, isAdmin, approveRequest, rejectRequest]
  );

  return (
    <PendingMatchesContext.Provider value={value}>
      {children}
    </PendingMatchesContext.Provider>
  );
};

export const usePendingMatches = () => {
  const context = useContext(PendingMatchesContext);
  if (!context) {
    throw new Error(
      "usePendingMatches must be used within a PendingMatchesProvider"
    );
  }
  return context;
};
