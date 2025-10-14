import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { NotificationProvider, useNotification } from "../NotificationContext";

const TestConsumer = () => {
  const { notify } = useNotification();
  return (
    <div>
      <button onClick={() => notify("Saved successfully", "success")}>
        trigger-success
      </button>
      <button onClick={() => notify("Something went wrong", "error")}>
        trigger-error
      </button>
    </div>
  );
};

const renderWithTheme = (children: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );

describe("NotificationContext", () => {
  it("displays success notifications", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TestConsumer />);

    await user.click(screen.getByText("trigger-success"));

    expect(await screen.findByText("Saved successfully")).toBeDefined();
  });

  it("overrides severity and message when notify is called again", async () => {
    const user = userEvent.setup();
    renderWithTheme(<TestConsumer />);

    await user.click(screen.getByText("trigger-success"));
    await screen.findByText("Saved successfully");

    await user.click(screen.getByText("trigger-error"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Something went wrong");
  });
});
