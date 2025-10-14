import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSnapshot } from "../../../test-utils/firebaseSnapshots";

const listeners: Array<{
  success: (snapshot: any) => void;
}> = [];

const refMock = vi.fn((_db: unknown, path?: string) => ({ path: path ?? "/" }));
const orderByChildMock = vi.fn((key: string) => ({ key }));
const queryMock = vi.fn((refValue: unknown) => ({ ref: refValue }));
const onValueMock = vi.fn(
  (
    _query: unknown,
    onSuccess: (snapshot: any) => void
  ) => {
    listeners.push({ success: onSuccess });
    return vi.fn();
  }
);

vi.mock("firebase/database", () => ({
  ref: (...args: Parameters<typeof refMock>) => refMock(...args),
  orderByChild: (...args: Parameters<typeof orderByChildMock>) =>
    orderByChildMock(...args),
  query: (...args: Parameters<typeof queryMock>) => queryMock(...args),
  onValue: (...args: Parameters<typeof onValueMock>) => onValueMock(...args),
}));

vi.mock("../../services/firebase", () => ({
  rtdb: {},
}));

import { usePlayerStats } from "../usePlayerStats";

describe("usePlayerStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-23T10:00:00Z"));
    listeners.length = 0;
    refMock.mockClear();
    orderByChildMock.mockClear();
    queryMock.mockClear();
    onValueMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates stats for the provided player", async () => {
    const { result } = renderHook(() => usePlayerStats("Bartek"));
    expect(listeners).toHaveLength(1);

    const snapshot = createSnapshot({
      a: {
        player1: "Bartek",
        player2: "Adam",
        rival1: "Random",
        rival2: "Dominik",
        result: "4-2",
        date: "2024-05-22T18:00:00.000Z",
      },
      b: {
        player1: "Adam",
        player2: "Dominik",
        rival1: "Bartek",
        rival2: "Random",
        result: "1 - 1",
        date: new Date("2024-05-21T18:00:00.000Z").getTime(),
      },
      c: {
        player1: "Marek",
        player2: "Random",
        rival1: "Bartek",
        rival2: "Adam",
        result: "0-3",
        date: "2024-05-10T18:00:00.000Z",
      },
      invalid: {
        player1: "Bartek",
        player2: "Adam",
        rival1: "Random",
        rival2: "Dominik",
        result: "walkover",
        date: "2024-05-09T18:00:00.000Z",
      },
    });

    act(() => {
      listeners[0].success(snapshot);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      lastResult: "4 : 2",
      lastOutcome: "WIN",
      weekMatches: 2,
      winPercent: 33,
      avgGoals: 2.7,
    });
  });

  it("returns default stats when no matches available", async () => {
    const { result } = renderHook(() => usePlayerStats("Bartek"));
    const snapshot = createSnapshot({
      x: {
        player1: "Adam",
        player2: "Dominik",
        rival1: "Random",
        rival2: "Marek",
        result: "1-0",
        date: 1728860400000,
      },
    });

    act(() => {
      listeners[0].success(snapshot);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      lastResult: "-",
      lastOutcome: null,
      weekMatches: 0,
      winPercent: 0,
      avgGoals: 0,
    });
  });
});
