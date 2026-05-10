import type { ReleaseNote } from "../types";
import {
  releaseNotesAction,
  releaseNotesClose,
  releaseNotesDialog,
  releaseNotesList,
  releaseNotesStatus,
} from "./dom";

let hasLoadedReleaseNotes = false;

export function bindReleaseNotesEvents(): void {
  releaseNotesAction.addEventListener("click", () => {
    releaseNotesDialog.showModal();
    if (!hasLoadedReleaseNotes) {
      void loadReleaseNotes();
    }
  });

  releaseNotesClose.addEventListener("click", () => {
    releaseNotesDialog.close();
  });

  releaseNotesDialog.addEventListener("click", (event) => {
    if (event.target === releaseNotesDialog) {
      releaseNotesDialog.close();
    }
  });
}

async function loadReleaseNotes(): Promise<void> {
  releaseNotesAction.disabled = true;
  releaseNotesStatus.textContent = "Loading release notes...";
  releaseNotesStatus.classList.remove("error");
  releaseNotesList.replaceChildren();

  try {
    const notes = await window.hudhud.getReleaseNotes();
    hasLoadedReleaseNotes = true;
    renderReleaseNotes(notes);
  } catch (err) {
    console.error("Failed to load release notes:", err);
    releaseNotesStatus.textContent =
      "Release notes could not be loaded. Check your connection and try again.";
    releaseNotesStatus.classList.add("error");
  } finally {
    releaseNotesAction.disabled = false;
  }
}

function renderReleaseNotes(notes: ReleaseNote[]): void {
  releaseNotesList.replaceChildren();

  if (notes.length === 0) {
    releaseNotesStatus.textContent = "No changelog are available yet.";
    return;
  }

  releaseNotesStatus.textContent = "";

  for (const note of notes) {
    releaseNotesList.append(createReleaseNoteElement(note));
  }
}

function createReleaseNoteElement(note: ReleaseNote): HTMLElement {
  const item = document.createElement("article");
  item.className = "release-note";

  const header = document.createElement("div");
  header.className = "release-note-header";

  const title = document.createElement("h3");
  title.textContent = note.title;

  const meta = document.createElement("span");
  meta.textContent = formatPublishedDate(note.publishedAt);

  header.append(title, meta);

  const body = document.createElement("pre");
  body.className = "release-note-body";
  body.textContent = note.body.trim() || "No release notes provided.";

  item.append(header, body);
  return item;
}

function formatPublishedDate(value: string | null): string {
  if (value === null) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
