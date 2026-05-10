import {
  feedbackClose,
  feedbackEmail,
  feedbackForm,
  feedbackMessage,
  feedbackPanel,
  feedbackStatus,
  feedbackSubmit,
  feedbackToggle,
} from "./dom";

type FeedbackStatus = "idle" | "error" | "success";

export async function bindFeedbackEvents(): Promise<void> {
  const enabled = await window.hudhud.isFeedbackEnabled();
  if (!enabled) {
    feedbackToggle.hidden = true;
    return;
  }

  feedbackToggle.addEventListener("click", () => {
    setFeedbackPanelOpen(feedbackPanel.hasAttribute("hidden"));
  });

  feedbackClose.addEventListener("click", () => {
    setFeedbackPanelOpen(false);
  });

  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitFeedback();
  });
}

async function submitFeedback(): Promise<void> {
  const email = feedbackEmail.value.trim();
  const feedback = feedbackMessage.value.trim();

  if (email !== "" && !feedbackEmail.validity.valid) {
    setStatus("Enter a valid email address.", "error");
    feedbackEmail.focus();
    return;
  }

  if (feedback === "") {
    setStatus("Feedback is required.", "error");
    feedbackMessage.focus();
    return;
  }

  setSubmitting(true);
  setStatus("Sending...", "idle");

  try {
    await window.hudhud.sendFeedback({
      email: email === "" ? undefined : email,
      feedback,
    });

    feedbackForm.reset();
    setStatus("", "idle");
    setFeedbackPanelOpen(false);
  } catch (err) {
    console.error("Failed to send feedback:", err);
    setStatus("Feedback could not be sent. Try again.", "error");
  } finally {
    setSubmitting(false);
  }
}

function setFeedbackPanelOpen(open: boolean): void {
  feedbackPanel.hidden = !open;
  feedbackToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    feedbackEmail.focus();
  }
}

function setSubmitting(submitting: boolean): void {
  feedbackSubmit.disabled = submitting;
  feedbackSubmit.textContent = submitting ? "Sending..." : "Send feedback";
}

function setStatus(message: string, status: FeedbackStatus): void {
  feedbackStatus.textContent = message;
  feedbackStatus.classList.toggle("error", status === "error");
  feedbackStatus.classList.toggle("success", status === "success");
}
