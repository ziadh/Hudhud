import type { MainPrayerName, PetStatus } from "../types";

type PetStatusCallback = (status: PetStatus) => void;
let petStatusCallback: PetStatusCallback | null = null;

export function setPetStatusCallback(cb: PetStatusCallback): void {
  petStatusCallback = cb;
}
import {
  MAIN_PRAYERS,
  PET_ALERT_WINDOW_MS,
  PET_HAPPY_MS,
  PET_ONBOARDING_BUBBLE,
  PET_PRAYER_CONFIRM_HINT,
  PET_PRAYER_ON_TIME_WINDOW_MS,
  PET_SCHEDULER_INTERVAL_MS,
} from "./constants";
import { PRAYER_CONFIRM_HINT_SEEN_KEY } from "./storage-keys";
import { parseTimingDate } from "./parsers";
import { confirmedPrayerOccurrences, state } from "./state";
import type { PetDecision, PrayerOccurrence, PrayerResult } from "./types";

export function startPetScheduler(): void {
  updatePetScheduler();

  if (state.petSchedulerTimer !== undefined) {
    return;
  }

  state.petSchedulerTimer = window.setInterval(
    updatePetScheduler,
    PET_SCHEDULER_INTERVAL_MS,
  );
}

export function updatePetScheduler(): void {
  const decision = getPetDecision();
  const nextStatus = withPrayerPrompt(
    decision.status,
    decision.activePrayerStartedAtMs,
  );
  state.activePrayerOccurrenceKey = decision.activeOccurrenceKey;
  window.hudhud.updatePetStatus(nextStatus);
  petStatusCallback?.(nextStatus);

  if (state.happyUntil !== null && Date.now() >= state.happyUntil) {
    state.happyUntil = null;
    clearHappyTimeout();
  }
}

function withPrayerPrompt(
  status: PetStatus,
  activePrayerStartedAtMs: number | null,
): PetStatus {
  if (
    status.animation !== "prayer" ||
    status.activePrayer === undefined ||
    activePrayerStartedAtMs === null
  ) {
    return status;
  }

  const prayerStartedElapsedMs = Date.now() - activePrayerStartedAtMs;
  const prayerPrompt =
    prayerStartedElapsedMs < PET_PRAYER_ON_TIME_WINDOW_MS
      ? `Time for ${status.activePrayer}`
      : `Did you pray ${status.activePrayer}?`;
  const lines = [prayerPrompt];
  if (!hasSeenPrayerConfirmHint()) {
    lines.push(PET_PRAYER_CONFIRM_HINT);
  }

  return {
    ...status,
    bubbleText: lines.join("\n"),
  };
}

export function confirmCurrentPrayer(prayer: MainPrayerName): void {
  const decision = getPetDecision();
  if (
    decision.status.animation !== "prayer" ||
    decision.status.activePrayer !== prayer ||
    decision.activeOccurrenceKey === null
  ) {
    return;
  }

  confirmedPrayerOccurrences.add(decision.activeOccurrenceKey);
  markPrayerConfirmHintSeen();
  state.activePrayerOccurrenceKey = null;
  state.happyUntil = Date.now() + PET_HAPPY_MS;
  window.hudhud.updatePetStatus({ animation: "happy" });
  petStatusCallback?.({ animation: "happy" });
  clearHappyTimeout();
  state.happyTimeout = window.setTimeout(() => {
    state.happyUntil = null;
    clearHappyTimeout();
    updatePetScheduler();
  }, PET_HAPPY_MS);
}

export function confirmActivePrayer(): void {
  const decision = getPetDecision();
  if (
    decision.status.animation !== "prayer" ||
    decision.status.activePrayer === undefined
  ) {
    return;
  }
  confirmCurrentPrayer(decision.status.activePrayer);
}

export function clearHappyTimeout(): void {
  if (state.happyTimeout !== undefined) {
    window.clearTimeout(state.happyTimeout);
    state.happyTimeout = undefined;
  }
}

function hasSeenPrayerConfirmHint(): boolean {
  return localStorage.getItem(PRAYER_CONFIRM_HINT_SEEN_KEY) === "true";
}

function markPrayerConfirmHintSeen(): void {
  localStorage.setItem(PRAYER_CONFIRM_HINT_SEEN_KEY, "true");
}

function getPetDecision(now = new Date()): PetDecision {
  const nowMs = now.getTime();

  if (state.happyUntil !== null && nowMs < state.happyUntil) {
    return {
      status: { animation: "happy" },
      activeOccurrenceKey: null,
      activePrayerStartedAtMs: null,
    };
  }

  if (state.activePrayerResult === null) {
    return {
      status: {
        animation: "idle",
        bubbleText: PET_ONBOARDING_BUBBLE,
      },
      activeOccurrenceKey: null,
      activePrayerStartedAtMs: null,
    };
  }

  const schedule = buildPrayerSchedule(state.activePrayerResult);
  if (schedule.length === 0) {
    return {
      status: {
        animation: "idle",
        bubbleText: PET_ONBOARDING_BUBBLE,
      },
      activeOccurrenceKey: null,
      activePrayerStartedAtMs: null,
    };
  }

  const latestStartedIndex = findLatestStartedPrayerIndex(schedule, nowMs);
  if (latestStartedIndex !== -1) {
    const occurrence = schedule[latestStartedIndex];
    const nextOccurrence = schedule[latestStartedIndex + 1];
    if (occurrence === undefined) {
      return {
        status: { animation: "idle" },
        activeOccurrenceKey: null,
        activePrayerStartedAtMs: null,
      };
    }

    const nextAlertStartMs =
      nextOccurrence === undefined
        ? Number.POSITIVE_INFINITY
        : nextOccurrence.date.getTime() - PET_ALERT_WINDOW_MS;
    const isConfirmed = confirmedPrayerOccurrences.has(occurrence.key);
    const isIshaSleepReady =
      occurrence.prayer === "Isha" &&
      nowMs >= occurrence.date.getTime() + PET_ALERT_WINDOW_MS;

    if (!isConfirmed && nowMs < nextAlertStartMs && !isIshaSleepReady) {
      return {
        status: {
          animation: "prayer",
          activePrayer: occurrence.prayer,
        },
        activeOccurrenceKey: occurrence.key,
        activePrayerStartedAtMs: occurrence.date.getTime(),
      };
    }
  }

  const sleepWindow = getSleepWindow(schedule, nowMs);
  if (
    sleepWindow !== null &&
    nowMs >= sleepWindow.startsAt.getTime() &&
    nowMs < sleepWindow.endsAt.getTime()
  ) {
    return {
      status: { animation: "sleep" },
      activeOccurrenceKey: null,
      activePrayerStartedAtMs: null,
    };
  }

  const alertOccurrence = schedule.find((occurrence) => {
    const prayerMs = occurrence.date.getTime();
    return nowMs >= prayerMs - PET_ALERT_WINDOW_MS && nowMs < prayerMs;
  });

  if (alertOccurrence !== undefined) {
    return {
      status: { animation: "alert" },
      activeOccurrenceKey: null,
      activePrayerStartedAtMs: null,
    };
  }

  return {
    status: { animation: "idle" },
    activeOccurrenceKey: null,
    activePrayerStartedAtMs: null,
  };
}

function buildPrayerSchedule(result: PrayerResult): PrayerOccurrence[] {
  const occurrences = MAIN_PRAYERS.flatMap((prayer) => {
    const date = parseTimingDate(result.timings[prayer]);
    return date === null ? [] : [createPrayerOccurrence(prayer, date)];
  });
  const fajr = parseTimingDate(result.timings.Fajr);
  const isha = parseTimingDate(result.timings.Isha);

  if (fajr !== null) {
    const tomorrowFajr = new Date(fajr);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    occurrences.push(createPrayerOccurrence("Fajr", tomorrowFajr));
  }

  if (isha !== null) {
    const yesterdayIsha = new Date(isha);
    yesterdayIsha.setDate(yesterdayIsha.getDate() - 1);
    occurrences.push(createPrayerOccurrence("Isha", yesterdayIsha));
  }

  return occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function createPrayerOccurrence(
  prayer: MainPrayerName,
  date: Date,
): PrayerOccurrence {
  return {
    prayer,
    date,
    key: `${prayer}:${date.toISOString()}`,
  };
}

function findLatestStartedPrayerIndex(
  schedule: PrayerOccurrence[],
  nowMs: number,
): number {
  for (let index = schedule.length - 1; index >= 0; index -= 1) {
    const occurrence = schedule[index];
    if (occurrence !== undefined && occurrence.date.getTime() <= nowMs) {
      return index;
    }
  }

  return -1;
}

function getSleepWindow(
  schedule: PrayerOccurrence[],
  nowMs: number,
): { startsAt: Date; endsAt: Date } | null {
  const isha = [...schedule]
    .reverse()
    .find(
      (occurrence) =>
        occurrence.prayer === "Isha" && occurrence.date.getTime() <= nowMs,
    );
  const nextFajr = schedule.find(
    (occurrence) =>
      occurrence.prayer === "Fajr" &&
      isha !== undefined &&
      occurrence.date.getTime() > isha.date.getTime(),
  );

  if (isha === undefined || nextFajr === undefined) {
    return null;
  }

  return {
    startsAt: isha.date,
    endsAt: new Date(nextFajr.date.getTime() - PET_ALERT_WINDOW_MS),
  };
}
