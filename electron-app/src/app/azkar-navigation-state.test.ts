import { describe, expect, test } from "bun:test";
import {
  defaultAzkarNavigationState,
  parseAzkarNavigationState,
} from "./azkar-navigation-state";

describe("azkar navigation state", () => {
  test("defaults missing storage", () => {
    expect(parseAzkarNavigationState(null)).toEqual(
      defaultAzkarNavigationState,
    );
  });

  test("restores valid reader and home states", () => {
    expect(
      parseAzkarNavigationState(
        JSON.stringify({
          view: "reader",
          period: "evening",
          entryIndex: 4,
        }),
      ),
    ).toEqual({ view: "reader", period: "evening", entryIndex: 4 });
    expect(
      parseAzkarNavigationState(
        JSON.stringify({
          view: "home",
          period: "morning",
          entryIndex: 0,
        }),
      ),
    ).toEqual({ view: "home", period: "morning", entryIndex: 0 });
  });

  test("defaults malformed JSON and non-object values", () => {
    expect(parseAzkarNavigationState("not json")).toEqual(
      defaultAzkarNavigationState,
    );
    expect(parseAzkarNavigationState("null")).toEqual(
      defaultAzkarNavigationState,
    );
  });

  test("defaults invalid fields independently", () => {
    expect(
      parseAzkarNavigationState(
        JSON.stringify({
          view: "unknown",
          period: "evening",
          entryIndex: 2,
        }),
      ),
    ).toEqual({ view: "home", period: "evening", entryIndex: 2 });
    expect(
      parseAzkarNavigationState(
        JSON.stringify({ view: "reader", period: "unknown" }),
      ),
    ).toEqual({ view: "reader", period: "morning", entryIndex: 0 });
  });

  test.each([
    -1,
    1.5,
    "2",
    null,
  ])("defaults invalid entry index %p", (entryIndex) => {
    expect(
      parseAzkarNavigationState(
        JSON.stringify({
          view: "reader",
          period: "morning",
          entryIndex,
        }),
      ).entryIndex,
    ).toBe(0);
  });

  test("defaults a non-finite entry index", () => {
    expect(
      parseAzkarNavigationState(
        '{"view":"reader","period":"morning","entryIndex":1e400}',
      ).entryIndex,
    ).toBe(0);
  });
});
