import type { ReleaseNote } from "../types";
import {
  appVersion,
  releaseNotesClose,
  releaseNotesDialog,
  releaseNotesList,
  releaseNotesStatus,
} from "./dom";

let hasLoadedReleaseNotes = false;
let currentVersion: string | null = null;

export function bindReleaseNotesEvents(): void {
  appVersion.addEventListener("click", () => {
    releaseNotesDialog.showModal();
    if (!hasLoadedReleaseNotes) {
      void loadReleaseNotes();
    }
  });

  appVersion.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
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
  appVersion.setAttribute("aria-busy", "true");
  releaseNotesStatus.textContent = "Loading release notes...";
  releaseNotesStatus.classList.remove("error");
  releaseNotesList.replaceChildren();

  try {
    const [notes, updateState] = await Promise.all([
      window.hudhud.getReleaseNotes(),
      window.hudhud.getUpdateState(),
    ]);
    currentVersion = updateState.currentVersion;
    hasLoadedReleaseNotes = true;
    renderReleaseNotes(notes);
  } catch (err) {
    console.error("Failed to load release notes:", err);
    releaseNotesStatus.textContent =
      "Release notes could not be loaded. Check your connection and try again.";
    releaseNotesStatus.classList.add("error");
  } finally {
    appVersion.removeAttribute("aria-busy");
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
  const isCurrent = isCurrentVersion(note.version);
  item.classList.toggle("current", isCurrent);

  const rail = document.createElement("div");
  rail.className = "release-note-rail";

  const marker = document.createElement("span");
  marker.className = "release-note-marker";
  marker.setAttribute("aria-hidden", "true");

  rail.append(marker);

  const content = document.createElement("div");
  content.className = "release-note-content";

  const header = document.createElement("div");
  header.className = "release-note-header";

  const titleRow = document.createElement("div");
  titleRow.className = "release-note-title";

  const title = document.createElement("h3");
  title.textContent = formatReleaseTitle(note);

  titleRow.append(title);

  if (isCurrent) {
    const currentBadge = document.createElement("span");
    currentBadge.className = "release-note-current";
    currentBadge.textContent = "Current version";
    titleRow.append(currentBadge);
  }

  const meta = document.createElement("span");
  meta.textContent = formatPublishedDate(note.publishedAt);

  header.append(titleRow, meta);

  const body = document.createElement("pre");
  body.className = "release-note-body";
  body.textContent = note.body.trim() || "No release notes provided.";

  content.append(header, body);
  item.append(rail, content);
  return item;
}

function isCurrentVersion(version: string): boolean {
  if (currentVersion === null) {
    return false;
  }

  return normalizeVersion(version) === normalizeVersion(currentVersion);
}

function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, "");
}

function formatReleaseTitle(note: ReleaseNote): string {
  return note.title.trim().replace(/^Hudhud\s+/i, "") || note.version;
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
