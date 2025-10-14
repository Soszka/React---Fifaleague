import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React 19 wymaga jawnej deklaracji środowiska wspierającego `act`.
// Dzięki temu ostrzeżenia o braku konfiguracji znikają w testach.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error – właściwość dodawana dynamicznie przez Reacta
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
});
