import { renderHook, waitFor } from "@testing-library/react";
import { act, PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSnapshot } from "../../../test-utils/firebaseSnapshots";

const listeners: Array<{
  success: (snapshot: any) => void;
  error?: (error: Error) => void;
}> = [];

const refMock = vi.fn((_db: unknown, path?: string) => ({ path: path ?? "/" }));
const onValueMock = vi.fn(
  (
    _ref: unknown,
    onSuccess: (snapshot: any) => void,
    onError?: (error: Error) => void
  ) => {
    listeners.push({ success: onSuccess, error: onError });
    return vi.fn();
  }
);
const removeMock = vi.fn(() => Promise.resolve());

vi.mock("firebase/database", () => ({
  ref: (...args: Parameters<typeof refMock>) => refMock(...args),
  onValue: (...args: Parameters<typeof onValueMock>) => onValueMock(...args),
  remove: (...args: Parameters<typeof removeMock>) => removeMock(...args),
}));

vi.mock("../../services/firebase", () => ({
  rtdb: {},
}));

const useAuthMock = vi.fn();
vi.mock("../AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

const matchesApi = {
  addMatch: vi.fn(),
  updateMatch: vi.fn(),
  removeMatch: vi.fn(),
};
const useMatchesMock = vi.fn(() => matchesApi);
vi.mock("../MatchesContext", () => ({
  useMatches: () => useMatchesMock(),
}));

import { PendingMatchesProvider, usePendingMatches } from "../PendingMatchesContext";

const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
  <PendingMatchesProvider>{children}</PendingMatchesProvider>
);

describe("PendingMatchesContext", () => {
  beforeEach(() => {
    listeners.length = 0;
    useAuthMock.mockReset();
    matchesApi.addMatch.mockReset();
    matchesApi.updateMatch.mockReset();
    matchesApi.removeMatch.mockReset();
    matchesApi.addMatch.mockResolvedValue("completed");
    matchesApi.updateMatch.mockResolvedValue("completed");
    matchesApi.removeMatch.mockResolvedValue("completed");
    useMatchesMock.mockReturnValue(matchesApi);
    refMock.mockClear();
    onValueMock.mockClear();
    removeMock.mockClear();
  });

  it("blocks approving requests for non-admin users", async () => {
    useAuthMock.mockReturnValue({ user: { email: "john@example.com", uid: "user-1" } });

    const { result } = renderHook(() => usePendingMatches(), { wrapper });

    act(() => {
      listeners[0].success(
        createSnapshot({
          req1: {
            actor: { id: "user-1", displayName: "John" },
            timestamp: 1728860400000,
            payload: {
              type: "create",
              match: {
                player1: "Adam",
                player2: "Marek",
                rival1: "Bartek",
                rival2: "Random",
                result: "2-1",
                date: 1728860400000,
              },
            },
          },
        })
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAdmin).toBe(false);
    await expect(result.current.approveRequest(result.current.requests[0])).rejects.toThrow(
      "Only Bartek can manage pending matches"
    );
  });

  it("approves requests and syncs with matches API for admins", async () => {
    useAuthMock.mockReturnValue({ user: { email: "bartek@bartek.com", uid: "admin" } });
    matchesApi.addMatch.mockResolvedValue("completed");

    const { result } = renderHook(() => usePendingMatches(), { wrapper });

    const requestRecord = {
      actor: { id: "user-1", displayName: "Adam" },
      timestamp: 1728860400000,
      payload: {
        type: "create" as const,
        match: {
          player1: "Adam",
          player2: "Marek",
          rival1: "Bartek",
          rival2: "Random",
          result: "2-1",
          date: 1728860400000,
        },
      },
    };

    act(() => {
      listeners[0].success(createSnapshot({ req1: requestRecord }));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.approveRequest(result.current.requests[0]);
    });

    expect(matchesApi.addMatch).toHaveBeenCalledWith(requestRecord.payload.match, {
      actorOverride: requestRecord.actor,
    });

    const removalCall = removeMock.mock.calls.find(
      ([ref]) => typeof ref === "object" && ref?.path === "/pendingMatchRequests/req1"
    );
    expect(removalCall).toBeDefined();
  });

  it("allows admins to reject requests", async () => {
    useAuthMock.mockReturnValue({ user: { email: "bartek@bartek.com", uid: "admin" } });

    const { result } = renderHook(() => usePendingMatches(), { wrapper });

    act(() => {
      listeners[0].success(
        createSnapshot({
          req1: {
            actor: { id: "user-1", displayName: "Adam" },
            timestamp: 1728860400000,
            payload: {
              type: "delete",
              matchId: "match-1",
              match: {
                player1: "Adam",
                player2: "Marek",
                rival1: "Bartek",
                rival2: "Random",
                result: "2-1",
                date: 1728860400000,
              },
            },
          },
        })
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.rejectRequest("req1");
    });

    const removalCall = removeMock.mock.calls.find(
      ([ref]) => typeof ref === "object" && ref?.path === "/pendingMatchRequests/req1"
    );
    expect(removalCall).toBeDefined();
  });
});
