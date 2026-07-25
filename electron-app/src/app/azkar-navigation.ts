export function getInitialAzkarEntryIndex(
  completedEntries: readonly boolean[],
): number {
  const firstIncomplete = completedEntries.findIndex((complete) => !complete);
  return firstIncomplete === -1 ? 0 : firstIncomplete;
}

export function clampAzkarEntryIndex(
  index: number,
  entryCount: number,
): number {
  if (entryCount <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), entryCount - 1);
}

export function moveAzkarEntryIndex(
  index: number,
  direction: "previous" | "next",
  entryCount: number,
): number {
  return clampAzkarEntryIndex(
    index + (direction === "previous" ? -1 : 1),
    entryCount,
  );
}
