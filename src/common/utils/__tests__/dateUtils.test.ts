import { describe, expect, it } from "vitest";
import { formatDateValue, normalizeDateValue } from "../dateUtils";

describe("normalizeDateValue", () => {
  it("returns the same value for numeric timestamps", () => {
    expect(normalizeDateValue(1728860400000)).toBe(1728860400000);
  });

  it("parses numeric strings", () => {
    expect(normalizeDateValue("1728860400000")).toBe(1728860400000);
  });

  it("parses ISO strings", () => {
    const iso = "2024-10-13T18:00:00.000Z";
    expect(normalizeDateValue(iso)).toBe(Date.parse(iso));
  });

  it("returns NaN for invalid values", () => {
    expect(Number.isNaN(normalizeDateValue("not-a-date"))).toBe(true);
    expect(Number.isNaN(normalizeDateValue(""))).toBe(true);
  });
});

describe("formatDateValue", () => {
  it("formats valid dates", () => {
    const iso = "2024-10-13T18:00:00.000Z";
    const formatted = formatDateValue(iso, "pl-PL");
    expect(formatted).not.toBe("");
  });

  it("returns empty string for invalid dates", () => {
    expect(formatDateValue("invalid")).toBe("");
  });
});
