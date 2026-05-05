import { previewPane } from "./dom";
import { formatCountdown, updateCountdown } from "./formatters";
import { state } from "./state";

let rolloverHandler: (() => void) | null = null;

export function setRolloverHandler(handler: () => void): void {
  rolloverHandler = handler;
}

export function startNextPrayerCountdown(): void {
  clearCountdown();

  const countdown = previewPane.querySelector<HTMLElement>(".time-remaining");
  const card = previewPane.querySelector<HTMLElement>("[data-next-prayer-at]");
  const targetValue = card?.dataset.nextPrayerAt;
  if (countdown === null || targetValue === undefined || targetValue === "") {
    return;
  }

  const target = new Date(targetValue);
  if (Number.isNaN(target.getTime())) {
    return;
  }

  const tickCountdown = (): void => {
    const now = new Date();
    updateCountdown(countdown, formatCountdown(target, now));

    if (now.getTime() >= target.getTime()) {
      clearCountdown();
      rolloverHandler?.();
    }
  };

  tickCountdown();
  state.countdownTimer = window.setInterval(tickCountdown, 1000);
}

export function clearCountdown(): void {
  if (state.countdownTimer !== undefined) {
    window.clearInterval(state.countdownTimer);
    state.countdownTimer = undefined;
  }
}
