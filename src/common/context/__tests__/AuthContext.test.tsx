import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, beforeEach, it, vi } from "vitest";
import type { User } from "firebase/auth";

const { listenAuthMock, loginMock, logoutMock } = vi.hoisted(() => ({
  listenAuthMock: vi.fn(),
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}));

vi.mock("../../services/firebase", () => ({
  listenAuth: (callback: (user: User | null) => void) => listenAuthMock(callback),
  login: (...args: Parameters<typeof loginMock>) => loginMock(...args),
  logout: (...args: Parameters<typeof logoutMock>) => logoutMock(...args),
}));

import { AuthProvider, useAuth } from "../AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    listenAuthMock.mockReset();
    loginMock.mockReset();
    logoutMock.mockReset();
  });

  it("exposes auth state updates from Firebase", async () => {
    let authListener: ((user: User | null) => void) | undefined;
    listenAuthMock.mockImplementation((callback: (u: User | null) => void) => {
      authListener = callback;
      return vi.fn();
    });

    const TestConsumer = () => {
      const { user, loading } = useAuth();
      return (
        <div>
          <span data-testid="loading">{loading ? "yes" : "no"}</span>
          <span data-testid="user">{user?.email ?? "none"}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("yes");
    expect(authListener).toBeDefined();

    const fakeUser = { uid: "123", email: "tester@example.com" } as User;
    await act(async () => {
      authListener?.(fakeUser);
    });

    expect(screen.getByTestId("loading").textContent).toBe("no");
    expect(screen.getByTestId("user").textContent).toBe("tester@example.com");

    await act(async () => {
      authListener?.(null);
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("delegates login and logout to Firebase helpers", async () => {
    const user = userEvent.setup();
    listenAuthMock.mockImplementation(() => vi.fn());
    loginMock.mockResolvedValue({} as never);
    logoutMock.mockResolvedValue();

    const TestConsumer = () => {
      const { login, logout } = useAuth();
      return (
        <div>
          <button onClick={() => login("john@example.com", "secret")}>log in</button>
          <button onClick={() => logout()}>log out</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("log in"));
    expect(loginMock).toHaveBeenCalledWith("john@example.com", "secret");

    await user.click(screen.getByText("log out"));
    expect(logoutMock).toHaveBeenCalled();
  });
});
