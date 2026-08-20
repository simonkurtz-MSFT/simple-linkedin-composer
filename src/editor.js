import Quill from "quill";

const TOOLBAR_LABELS = [
  [".ql-bold", "Bold (Ctrl+B)"],
  [".ql-italic", "Italic (Ctrl+I)"],
  ['.ql-list[value="ordered"]', "Ordered List"],
  ['.ql-list[value="bullet"]', "Bullet List"],
  [".ql-clean", "Remove Formatting from selected content"],
  [".ql-emoji", "Insert Emoji"],
  [".ql-clear", "Clear Editor"],
];

const CUSTOM_TOOLBAR_ICONS = [
  [".ql-emoji", "☺"],
  [".ql-clear", "🗑"],
];

export const createEditor = ({
  container,
  emojiPanel,
  confirmDiscard = () =>
    confirm(
      "You have unsaved changes. Do you want to discard them and proceed?",
    ),
}) => {
  const document = container.ownerDocument;
  let hasUnsavedChanges = false;
  let emojiButton;
  let lastSelection = { index: 0, length: 0 };

  const setEmojiPickerOpen = (isOpen) => {
    emojiPanel.style.display = isOpen ? "block" : "none";
    emojiPanel.setAttribute("aria-hidden", String(!isOpen));
    emojiButton?.setAttribute("aria-expanded", String(isOpen));
  };

  const isEmojiPickerOpen = () => emojiPanel.style.display === "block";

  const toggleEmojiPicker = () => {
    const rect = container.getBoundingClientRect();
    emojiPanel.style.top = `${rect.top + 10}px`;
    emojiPanel.style.left = `${rect.left + 10}px`;
    setEmojiPickerOpen(!isEmojiPickerOpen());
  };

  const closeEmojiPicker = ({ restoreFocus = false } = {}) => {
    setEmojiPickerOpen(false);
    if (restoreFocus) emojiButton?.focus();
  };

  const confirmUnsavedChanges = () =>
    hasUnsavedChanges ? Boolean(confirmDiscard()) : true;

  const quill = new Quill(container, {
    modules: {
      toolbar: {
        container: [
          ["bold", "italic"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["clean", "emoji", "clear"],
        ],
        handlers: {
          emoji: toggleEmojiPicker,
          clear: () => {
            if (!confirmUnsavedChanges()) return;
            quill.setText("");
            hasUnsavedChanges = false;
            quill.focus();
          },
        },
      },
      clipboard: { matchers: [] },
    },
    placeholder: "Write your LinkedIn post...",
    theme: "snow",
  });

  const toolbar = quill.getModule("toolbar").container;
  TOOLBAR_LABELS.forEach(([selector, label]) => {
    const button = toolbar.querySelector(selector);
    if (!button) return;
    button.title = label;
    button.setAttribute("aria-label", label);
  });
  CUSTOM_TOOLBAR_ICONS.forEach(([selector, icon]) => {
    const button = toolbar.querySelector(selector);
    if (button) button.textContent = icon;
  });
  emojiButton = toolbar.querySelector(".ql-emoji");
  emojiButton?.setAttribute("aria-controls", emojiPanel.id);
  emojiButton?.setAttribute("aria-expanded", "false");

  quill.on("text-change", () => {
    hasUnsavedChanges = true;
  });

  quill.on("selection-change", (range) => {
    if (range) lastSelection = range;
  });

  emojiPanel
    .querySelector("emoji-picker")
    ?.addEventListener("emoji-click", (event) => {
      const emoji = event.detail?.unicode;
      if (typeof emoji !== "string" || !emoji) return;
      const range = quill.getSelection() ?? lastSelection;
      const insertionIndex = Math.min(range.index, quill.getLength() - 1);
      quill.insertText(insertionIndex, emoji);
      quill.setSelection(insertionIndex + emoji.length, 0);
      closeEmojiPicker({ restoreFocus: true });
    });

  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".emoji-picker-container") &&
      !event.target.closest(".ql-emoji")
    ) {
      closeEmojiPicker();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isEmojiPickerOpen()) {
      closeEmojiPicker({ restoreFocus: true });
    }
  });

  return {
    quill,
    confirmUnsavedChanges,
    markSaved: () => {
      hasUnsavedChanges = false;
    },
    insertText(text) {
      const range = quill.getSelection();
      if (!range) return;
      quill.insertText(range.index, text);
      quill.setSelection(range.index + text.length);
    },
    setContents(delta) {
      quill.setContents(delta);
      hasUnsavedChanges = false;
    },
  };
};
