import { describe, expect, test } from "bun:test";
import { azkarEntries } from "./azkar-data";

const expectedReferences = [
  "75",
  "76a",
  "76b",
  "76c",
  "77",
  "78",
  "79",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
].map((number) => `Hisn al-Muslim ${number}`);

describe("azkar data", () => {
  test("preserves the morning and evening collections", () => {
    expect(
      azkarEntries.filter((entry) => entry.period === "morning"),
    ).toHaveLength(26);
    expect(
      azkarEntries.filter((entry) => entry.period === "evening"),
    ).toHaveLength(23);
  });

  test("contains complete, plain-text English content", () => {
    for (const entry of azkarEntries) {
      expect(entry.arabic.trim()).not.toBe("");
      expect(entry.transliteration.trim()).not.toBe("");
      expect(entry.translation.trim()).not.toBe("");
      expect(entry.reference.trim()).not.toBe("");
      expect(entry.repeat).toBeGreaterThan(0);
      expect(entry.transliteration).not.toMatch(/<[^>]+>/);
      expect(entry.translation).not.toMatch(/<[^>]+>/);
      expect(entry.transliteration).not.toContain("\uFFFD");
      expect(entry.translation).not.toContain("\uFFFD");
      expect(entry.transliteration.normalize("NFC")).toBe(
        entry.transliteration,
      );
      expect(entry.translation.normalize("NFC")).toBe(entry.translation);
    }
  });

  test("covers every expected reference with unique generated ids", () => {
    expect(new Set(azkarEntries.map((entry) => entry.reference))).toEqual(
      new Set(expectedReferences),
    );
    expect(new Set(azkarEntries.map((entry) => entry.id)).size).toBe(
      azkarEntries.length,
    );
  });

  test("uses identical supporting text for identical Arabic records", () => {
    const contentByArabic = new Map<
      string,
      { transliteration: string; translation: string }
    >();

    for (const entry of azkarEntries) {
      const existing = contentByArabic.get(entry.arabic);
      if (existing === undefined) {
        contentByArabic.set(entry.arabic, {
          transliteration: entry.transliteration,
          translation: entry.translation,
        });
        continue;
      }

      expect(entry.transliteration).toBe(existing.transliteration);
      expect(entry.translation).toBe(existing.translation);
    }
  });
});
