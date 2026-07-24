import { describe, expect, test } from "bun:test";
import {
  parseAzkarDisplayPreferences,
  toggleAzkarDisplayPreference,
} from "./azkar-display";

describe("azkar display preferences", () => {
  test("defaults both supporting fields to visible", () => {
    expect(parseAzkarDisplayPreferences(null)).toEqual({
      transliteration: true,
      translation: true,
    });
  });

  test("restores valid independent settings", () => {
    expect(
      parseAzkarDisplayPreferences(
        JSON.stringify({ transliteration: false, translation: true }),
      ),
    ).toEqual({ transliteration: false, translation: true });
  });

  test("defaults malformed and missing properties safely", () => {
    expect(parseAzkarDisplayPreferences("not json")).toEqual({
      transliteration: true,
      translation: true,
    });
    expect(
      parseAzkarDisplayPreferences(JSON.stringify({ translation: false })),
    ).toEqual({ transliteration: true, translation: false });
  });

  test("toggles one setting without mutating the input or the other setting", () => {
    const original = { transliteration: true, translation: true };
    const updated = toggleAzkarDisplayPreference(original, "translation");

    expect(updated).toEqual({ transliteration: true, translation: false });
    expect(original).toEqual({ transliteration: true, translation: true });
  });
});
