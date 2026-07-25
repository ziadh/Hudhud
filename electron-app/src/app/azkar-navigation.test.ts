import { describe, expect, test } from "bun:test";
import {
  clampAzkarEntryIndex,
  getInitialAzkarEntryIndex,
  moveAzkarEntryIndex,
} from "./azkar-navigation";

describe("azkar single-view navigation", () => {
  test("starts at the first incomplete entry", () => {
    expect(getInitialAzkarEntryIndex([true, true, false, false])).toBe(2);
  });

  test("starts at the first entry when the set is complete", () => {
    expect(getInitialAzkarEntryIndex([true, true, true])).toBe(0);
  });

  test("clamps indexes to the available entries", () => {
    expect(clampAzkarEntryIndex(-1, 3)).toBe(0);
    expect(clampAzkarEntryIndex(4, 3)).toBe(2);
    expect(clampAzkarEntryIndex(2, 0)).toBe(0);
  });

  test("moves freely between entries without wrapping", () => {
    expect(moveAzkarEntryIndex(1, "next", 3)).toBe(2);
    expect(moveAzkarEntryIndex(2, "next", 3)).toBe(2);
    expect(moveAzkarEntryIndex(1, "previous", 3)).toBe(0);
    expect(moveAzkarEntryIndex(0, "previous", 3)).toBe(0);
  });
});
