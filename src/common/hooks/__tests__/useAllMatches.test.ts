import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
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

vi.mock("firebase/database", () => ({
  ref: (...args: Parameters<typeof refMock>) => refMock(...args),
  onValue: (...args: Parameters<typeof onValueMock>) => onValueMock(...args),
}));

vi.mock("../../services/firebase", () => ({
  rtdb: {},
}));

import { useAllMatches } from "../useAllMatches";

describe("useAllMatches", () => {
  beforeEach(() => {
    listeners.length = 0;
    refMock.mockClear();
    onValueMock.mockClear();
  });

  it("normalizes matches from realtime database", async () => {
    const { result } = renderHook(() => useAllMatches());

    expect(result.current.loading).toBe(true);
    expect(listeners).toHaveLength(1);

    const snapshot = createSnapshot({
      matches: {
        match1: {
          player1: "Adam",
          player2: "Marek",
          rival1: "Bartek",
          rival2: "Random",
          result: "2-1",
          date: "2024-05-10T18:00:00.000Z",
        },
      },
      another: {
        player1: "Bartek",
        player2: "Adam",
        rival1: "Random",
        rival2: "Dominik",
        result: "3:2",
        date: 1728860400000,
      },
    });

    act(() => {
      listeners[0].success(snapshot);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.matches).toEqual([
      {
        team1: "Bartek & Adam",
        team2: "Random & Dominik",
        score: "3:2",
        date: 1728860400000,
      },
      {
        team1: "Adam & Marek",
        team2: "Bartek & Random",
        score: "2 : 1",
        date: Date.parse("2024-05-10T18:00:00.000Z"),
      },
    ]);
  });

  it("handles empty snapshot", async () => {
    const { result } = renderHook(() => useAllMatches());
    act(() => {
      listeners[0].success(createSnapshot(null));
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.matches).toEqual([]);
  });

  it("exposes subscription errors", async () => {
    const { result } = renderHook(() => useAllMatches());
    const error = new Error("permission denied");
    act(() => {
      listeners[0].error?.(error);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(error);
  });
});
