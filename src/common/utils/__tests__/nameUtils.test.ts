import { describe, expect, it } from "vitest";
import { formatDisplayName, restoreDiacritics, stripDiacritics } from "../nameUtils";

describe("name utils", () => {
  it("strips diacritics consistently", () => {
    expect(stripDiacritics("Łukasz")).toBe("Lukasz");
  });

  it("restores known player labels", () => {
    expect(formatDisplayName("bartek")).toBe("Bartek");
    expect(restoreDiacritics("grzesiek s")).toBe("Grzesiek Ś");
  });

  it("capitalizes unknown names", () => {
    expect(formatDisplayName("unknown")).toBe("Unknown");
  });
});
