import { renderHook, waitFor } from "@testing-library/react";
import { act, PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSnapshot } from "../../../test-utils/firebaseSnapshots";

const listeners: Array<{
  success: (snapshot: any) => void;
  error?: (error: Error) => void;
}> = [];

const refMock = vi.fn((_db: unknown, path?: string) => ({ path: path ?? "/" }));
let pushCounter = 0;
const pushMock = vi.fn((refValue: { path: string }) => {
  pushCounter += 1;
  const key = `generated-${pushCounter}`;
  return {
    key,
    path: `${refValue.path}/${key}`,
  };
});
const setMock = vi.fn<
  (refValue: { path?: string }, value?: unknown) => Promise<void>
>(() => Promise.resolve());
const removeMock = vi.fn<(refValue: { path?: string }) => Promise<void>>(
  () => Promise.resolve()
);
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

vi.mock("firebase/database", () => ({
  ref: (...args: Parameters<typeof refMock>) => refMock(...args),
  push: (...args: Parameters<typeof pushMock>) => pushMock(...args),
  set: (...args: Parameters<typeof setMock>) => setMock(...args),
  remove: (...args: Parameters<typeof removeMock>) => removeMock(...args),
  onValue: (...args: Parameters<typeof onValueMock>) => onValueMock(...args),
}));

vi.mock("../../services/firebase", () => ({
  rtdb: {},
}));

const useAuthMock = vi.fn();
vi.mock("../AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

import { MatchesProvider, useMatches } from "../MatchesContext";

const wrapper = ({ children }: PropsWithChildren) => (
  <MatchesProvider>{children}</MatchesProvider>
);

describe("MatchesContext", () => {
  beforeEach(() => {
    listeners.length = 0;
    pushCounter = 0;
    useAuthMock.mockReset();
    refMock.mockClear();
    pushMock.mockClear();
    setMock.mockClear();
    removeMock.mockClear();
    onValueMock.mockClear();
  });

  it("parses and sorts matches from the database", async () => {
    useAuthMock.mockReturnValue({
      user: { email: "bartek@bartek.com", uid: "admin" },
    });

    const { result } = renderHook(() => useMatches(), { wrapper });

    expect(listeners).toHaveLength(1);

    act(() => {
      listeners[0].success(
        createSnapshot({
          matches: {
            alpha: {
              player1: "Adam",
              player2: "Dominik",
              rival1: "Bartek",
              rival2: "Random",
              result: "1-0",
              date: "2024-05-10T18:00:00.000Z",
            },
          },
          beta: {
            player1: "Bartek",
            player2: "Adam",
            rival1: "Random",
            rival2: "Dominik",
            result: "3-1",
            date: 1728860400000,
          },
        })
      );
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches.map((m) => m.id)).toEqual([
      "beta",
      "alpha",
    ]);
    expect(result.current.canManageMatches).toBe(true);
  });

  it("queues create requests for non-admin users", async () => {
    useAuthMock.mockReturnValue({
      user: { email: "john@example.com", uid: "user-1" },
    });

    const { result } = renderHook(() => useMatches(), { wrapper });

    act(() => {
      listeners[0].success(createSnapshot(null));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const outcome = await result.current.addMatch({
        player1: "Adam",
        player2: "Marek",
        rival1: "Bartek",
        rival2: "Random",
        result: "2-1",
        date: 1728860400000,
      });
      expect(outcome).toBe("queued");
    });

    const pendingCall = setMock.mock.calls.find(([ref]) => {
      const refWithPath = ref as { path?: string } | undefined;
      return (
        typeof refWithPath === "object" &&
        refWithPath?.path?.startsWith("/pendingMatchRequests/")
      );
    });
    expect(pendingCall).toBeDefined();

    const directMatchPersist = setMock.mock.calls.find(([ref]) => {
      const refWithPath = ref as { path?: string } | undefined;
      return (
        typeof refWithPath === "object" &&
        refWithPath?.path?.includes("generated-") &&
        refWithPath?.path?.startsWith("//")
      );
    });
    expect(directMatchPersist).toBeUndefined();
  });

  it("persists matches immediately for admin users", async () => {
    useAuthMock.mockReturnValue({
      user: { email: "bartek@bartek.com", uid: "admin" },
    });

    const { result } = renderHook(() => useMatches(), { wrapper });

    act(() => {
      listeners[0].success(createSnapshot(null));
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const outcome = await result.current.addMatch({
        player1: "Adam",
        player2: "Marek",
        rival1: "Bartek",
        rival2: "Random",
        result: "2-1",
        date: 1728860400000,
      });
      expect(outcome).toBe("completed");
    });

    await waitFor(() => expect(result.current.matches.length).toBeGreaterThan(0));

    expect(result.current.matches[0]).toMatchObject({
      player1: "Adam",
      player2: "Marek",
      result: "2-1",
    });

    const matchPersistCall = setMock.mock.calls.find(([ref]) => {
      const refWithPath = ref as { path?: string } | undefined;
      return (
        typeof refWithPath === "object" &&
        refWithPath?.path?.includes("generated-") &&
        refWithPath?.path?.startsWith("//")
      );
    });
    expect(matchPersistCall).toBeDefined();

    const activityCall = setMock.mock.calls.find(([ref]) => {
      const refWithPath = ref as { path?: string } | undefined;
      return (
        typeof refWithPath === "object" &&
        typeof refWithPath?.path === "string" &&
        refWithPath.path.startsWith("/activityLogs/")
      );
    });
    expect(activityCall).toBeDefined();
  });
});
