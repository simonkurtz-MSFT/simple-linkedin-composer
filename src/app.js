import { openAccordion, setupAccordions } from "./accordion.js";
import { createEditor } from "./editor.js";
import { downloadFile, pickFile } from "./file-transfer.js";
import {
  countSnippetHashtags,
  sortHashtagsByCount,
  sortHashtagsByName,
} from "./hashtag-data.js";
import { renderHashtagList } from "./hashtag-list.js";
import { createNotifier } from "./notifications.js";
import { convertSemanticHtmlToLinkedInText } from "./post-conversion.js";
import { samplePost } from "./sample-post.js";
import {
  createSnippetExport,
  importSnippets as mergeSnippetImport,
  loadStoredSnippets,
  parseSnippet,
  SNIPPET_KEY_PREFIX,
} from "./snippet-data.js";
import { createSnippetTable } from "./snippet-table.js";

const LINKEDIN_USER_ID_KEY = "linkedin_id";
const LINKEDIN_BASE_URL = "https://www.linkedin.com/in/";
const HASHTAGS_KEY = "hashtags";
const FIRST_TIME_USER_KEY = "firstTimeUser";

const byId = (id) => document.getElementById(id);

const notifier = createNotifier();
const editor = createEditor({
  container: byId("editor-container"),
  emojiPanel: byId("emoji-picker-panel"),
});

let snippets = {};
let hashtags = {};
let sortNameAsc = true;
let sortCountAsc = true;

// LinkedIn profile

const updateLinkedInLinks = (userId) => {
  const hasUser = Boolean(userId);
  if (hasUser) {
    const profileUrl = `${LINKEDIN_BASE_URL}${encodeURIComponent(userId)}/`;
    byId("linkedin-create-post").href = `${profileUrl}overlay/create-post`;
    byId("linkedin-my-posts").href = `${profileUrl}recent-activity/all/`;
  }
  byId("linkedin-links").hidden = !hasUser;
  byId("linkedin-publish-link").hidden = !hasUser;
};

const loadLinkedInUserId = () => {
  const storedUserId = localStorage.getItem(LINKEDIN_USER_ID_KEY) ?? "";
  byId("linkedin-user-id").value = storedUserId;
  updateLinkedInLinks(storedUserId);
};

// Hashtags

const renderHashtags = () =>
  renderHashtagList({
    container: byId("hashtag-list"),
    hashtags,
    onInsert: (tag) => editor.insertText(`${tag} `),
  });

const refreshHashtags = () => {
  hashtags = countSnippetHashtags(snippets);
  localStorage.setItem(HASHTAGS_KEY, JSON.stringify(hashtags));
  renderHashtags();
};

const applyHashtagSort = (entries, pressedId, releasedId) => {
  hashtags = Object.fromEntries(entries);
  renderHashtags();
  byId(pressedId).setAttribute("aria-pressed", "true");
  byId(releasedId).setAttribute("aria-pressed", "false");
};

// Snippets

const snippetsHeader = byId("snippets-header");
const snippetsHeaderLabel = snippetsHeader.querySelector("[data-count-label]");

const snippetTable = createSnippetTable({
  table: byId("snippets-table"),
  searchInput: byId("snippet-search"),
  pager: byId("snippet-pager"),
  pageSizeSelect: byId("snippet-page-size"),
  onLoad: (title) => loadSnippet(title),
  onDelete: (title) => deleteSnippet(title),
  onCountChange: (label) => {
    snippetsHeaderLabel.textContent = `Snippets (${label})`;
  },
});

const refreshSnippets = () => {
  snippets = loadStoredSnippets(localStorage).snippets;
  snippetTable.setSnippets(snippets);
};

const refreshLibrary = () => {
  refreshSnippets();
  refreshHashtags();
};

const saveSnippet = () => {
  if (!editor.quill.getText().trim()) {
    notifier.info("The editor is empty. Please write something to save.");
    return;
  }

  const titleInput = byId("snippet-title");
  const title = titleInput.value.trim().substring(0, 50);
  if (!title) {
    notifier.warning("Please enter a title for the snippet.");
    return;
  }

  if (
    snippets[title] &&
    !confirm(
      `A snippet with this title already exists. Do you want to overwrite it?\n\n${title}`,
    )
  ) {
    return;
  }

  localStorage.setItem(
    `${SNIPPET_KEY_PREFIX}${title}`,
    JSON.stringify({
      delta: editor.quill.getContents(),
      timestamp: new Date().toISOString(),
      isTemplate: byId("is-template").checked,
    }),
  );
  editor.markSaved();
  notifier.success("Snippet saved successfully");
  refreshLibrary();
};

function loadSnippet(title) {
  if (!editor.confirmUnsavedChanges()) return;

  const stored = localStorage.getItem(`${SNIPPET_KEY_PREFIX}${title}`);
  if (!stored) {
    notifier.warning("Snippet not found.");
    return;
  }
  const snippet = parseSnippet(stored);
  if (!snippet) {
    notifier.error("This snippet is invalid and could not be loaded.");
    return;
  }
  editor.setContents(snippet.delta);
  byId("is-template").checked = snippet.isTemplate === true;
  byId("snippet-title").value = title;
}

function deleteSnippet(title) {
  if (!confirm(`Are you sure you want to delete this snippet?\n\n${title}`)) {
    return;
  }
  localStorage.removeItem(`${SNIPPET_KEY_PREFIX}${title}`);
  refreshLibrary();
}

const clearAllData = () => {
  if (localStorage.length === 0) return;
  if (
    !confirm(
      "Are you sure you want to clear all Simple LinkedIn Composer data from your browser's storage? This includes snippets as well as any settings.\n\nConsider exporting your saved snippets first as this clear action cannot be undone.",
    )
  ) {
    return;
  }
  localStorage.clear();
  refreshLibrary();
  loadLinkedInUserId();
  notifier.success("All localStorage data has been cleared.");
};

const exportSnippets = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadFile(
    `LinkedIn-Composer-Data-${timestamp}.json`,
    JSON.stringify(createSnippetExport(localStorage), null, 2),
  );
  notifier.success("Snippets exported successfully");
};

const importSnippets = async () => {
  if (!editor.confirmUnsavedChanges()) return;
  const file = await pickFile();
  if (!file) return;

  try {
    const result = mergeSnippetImport(await file.text(), localStorage);
    if (result.imported > 0) {
      notifier.success(`Successfully imported ${result.imported} snippet(s).`);
      refreshLibrary();
    } else {
      notifier.info(
        "No new snippets were imported. The data may already exist in localStorage.",
      );
    }
    if (result.invalid > 0) {
      notifier.warning(
        `${result.invalid} invalid import entr${result.invalid === 1 ? "y was" : "ies were"} skipped.`,
      );
    }
  } catch {
    notifier.error("Failed to import data. Please check the file format.");
  }
};

// Clipboard

const copyToClipboard = async () => {
  const clipboardText = convertSemanticHtmlToLinkedInText(
    editor.quill.getSemanticHTML().trim(),
  );
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([clipboardText], { type: "text/plain" }),
      }),
    ]);
    notifier.success("Post copied to clipboard. Paste it into LinkedIn!");
  } catch {
    notifier.error("Failed to copy content. Please try again.");
  }
};

// Startup

const checkFirstTimeUser = () => {
  if (localStorage.getItem(FIRST_TIME_USER_KEY)) return;
  openAccordion(byId("instructions"));
  notifier.info(
    "Welcome to Simple LinkedIn Composer! I hope you find this app useful. Please check the instructions to get started.",
  );
  localStorage.setItem(FIRST_TIME_USER_KEY, "false");
};

const setupEventListeners = () => {
  byId("linkedin-user-id").addEventListener("input", (event) => {
    const userId = event.target.value.trim();
    localStorage.setItem(LINKEDIN_USER_ID_KEY, userId);
    updateLinkedInLinks(userId);
  });
  byId("sort-name").addEventListener("click", () => {
    applyHashtagSort(
      sortHashtagsByName(hashtags, sortNameAsc),
      "sort-name",
      "sort-count",
    );
    sortNameAsc = !sortNameAsc;
  });
  byId("sort-count").addEventListener("click", () => {
    applyHashtagSort(
      sortHashtagsByCount(hashtags, sortCountAsc),
      "sort-count",
      "sort-name",
    );
    sortCountAsc = !sortCountAsc;
  });

  byId("clear-button").addEventListener("click", clearAllData);
  byId("save-button").addEventListener("click", saveSnippet);
  byId("export-data").addEventListener("click", exportSnippets);
  byId("import-data").addEventListener("click", importSnippets);
  byId("load-sample-button").addEventListener("click", () => {
    if (editor.confirmUnsavedChanges()) editor.setContents(samplePost);
  });

  byId("copy-button").addEventListener("click", copyToClipboard);
  byId("editor-container").addEventListener("copy", copyToClipboard);
};

loadLinkedInUserId();
setupAccordions();
refreshLibrary();
setupEventListeners();
checkFirstTimeUser();
editor.quill.focus();
