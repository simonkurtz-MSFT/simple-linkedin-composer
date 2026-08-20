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
const GITHUB_REPOSITORY_API_URL =
  "https://api.github.com/repos/simonkurtz-MSFT/simple-linkedin-composer";
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

// GitHub statistics

const updateGitHubStat = (name, count) => {
  if (!Number.isSafeInteger(count) || count < 0) return;
  const stat = byId(`github-${name}`);
  const formattedCount = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(count);
  byId(`github-${name.slice(0, -1)}-count`).textContent = formattedCount;
  stat.setAttribute("aria-label", `GitHub ${name}: ${count.toLocaleString()}`);
};

const loadGitHubStats = async () => {
  try {
    const response = await fetch(GITHUB_REPOSITORY_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return;
    const data = await response.json();
    updateGitHubStat("stars", data.stargazers_count);
    updateGitHubStat("forks", data.forks_count);
    updateGitHubStat("watchers", data.subscribers_count);
  } catch {
    // Statistics are optional; keep the stable placeholders when GitHub is unavailable.
  }
};

// LinkedIn profile

const updateLinkedInLinks = (userId) => {
  const hasUser = Boolean(userId);
  if (hasUser) {
    const profileUrl = `${LINKEDIN_BASE_URL}${encodeURIComponent(userId)}/`;
    byId("linkedin-create-post").href = `${profileUrl}overlay/create-post`;
  }
  byId("linkedin-publish-link").hidden = !hasUser;
};

const loadLinkedInUserId = () => {
  const storedUserId = localStorage.getItem(LINKEDIN_USER_ID_KEY) ?? "";
  byId("linkedin-user-id").value = storedUserId;
  updateLinkedInLinks(storedUserId);
};

const openSettings = () => {
  const dialog = byId("settings-dialog");
  if (!dialog.open) dialog.showModal();
  byId("linkedin-user-id").focus();
};

const closeSettings = () => {
  const dialog = byId("settings-dialog");
  if (dialog.open) dialog.close();
};

const saveSettings = () => {
  const userId = byId("linkedin-user-id").value.trim();
  if (userId) {
    localStorage.setItem(LINKEDIN_USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(LINKEDIN_USER_ID_KEY);
  }
  updateLinkedInLinks(userId);
  notifier.success("Settings saved.");
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
  templateFilter: byId("template-filter"),
  pager: byId("snippet-pager"),
  pageSizeSelect: byId("snippet-page-size"),
  onLoad: (title) => loadSnippet(title),
  onDelete: (title) => deleteSnippet(title),
  onCountChange: (label) => {
    snippetsHeaderLabel.textContent = `Saved snippets (${label})`;
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

  const existingSnippet = snippets[title];
  if (existingSnippet) {
    const overwriteMessage = existingSnippet.isTemplate
      ? `This title belongs to a protected template. Overwriting it permanently replaces the reusable template. Continue only if you intend to update the template.\n\n${title}`
      : `A snippet with this title already exists. Do you want to overwrite it?\n\n${title}`;
    if (!confirm(overwriteMessage)) return;
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
  if (snippet.isTemplate) {
    byId("is-template").checked = false;
    byId("snippet-title").value = "";
    notifier.info(
      `Template "${title}" loaded as a new draft. Give it a new title to save your changes.`,
    );
  } else {
    byId("is-template").checked = false;
    byId("snippet-title").value = title;
  }
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
    if (result.protected > 0) {
      notifier.warning(
        `${result.protected} existing template${result.protected === 1 ? " was" : "s were"} protected from replacement.`,
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
  byId("settings-button").addEventListener("click", openSettings);
  byId("settings-close-button").addEventListener("click", closeSettings);
  byId("settings-cancel-button").addEventListener("click", closeSettings);
  byId("settings-form").addEventListener("submit", saveSettings);
  byId("settings-dialog").addEventListener("close", () => {
    byId("settings-button").focus();
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
};

loadLinkedInUserId();
loadGitHubStats();
setupAccordions();
refreshLibrary();
setupEventListeners();
checkFirstTimeUser();
if (localStorage.getItem(LINKEDIN_USER_ID_KEY)) {
  editor.quill.focus();
} else {
  openSettings();
}
