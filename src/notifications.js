const LEVELS = Object.freeze({
  success: { role: "status", live: "polite" },
  info: { role: "status", live: "polite" },
  warning: { role: "alert", live: "assertive" },
  error: { role: "alert", live: "assertive" },
});

export const createNotifier = ({
  document: targetDocument = globalThis.document,
  timeoutMs = 2000,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
} = {}) => {
  let container = targetDocument.getElementById("toast-container");
  if (!container) {
    container = targetDocument.createElement("div");
    container.id = "toast-container";
    targetDocument.body.append(container);
  }

  const timers = new Map();

  const dismiss = (toast) => {
    const timer = timers.get(toast);
    if (timer !== undefined) cancel(timer);
    timers.delete(toast);
    toast.remove();
  };

  const isDuplicate = (title, message) =>
    [...container.children].some(
      (toast) =>
        toast.querySelector(".toast-title")?.textContent === title &&
        toast.querySelector(".toast-message")?.textContent === message,
    );

  const show = (level, message, title) => {
    if (isDuplicate(title, message)) return null;

    const { role, live } = LEVELS[level];
    const toast = targetDocument.createElement("div");
    toast.className = `toast toast-${level}`;
    toast.setAttribute("role", role);
    toast.setAttribute("aria-live", live);

    const body = targetDocument.createElement("div");
    body.className = "toast-body";
    if (title) {
      const heading = targetDocument.createElement("strong");
      heading.className = "toast-title";
      heading.textContent = title;
      body.append(heading);
    }
    const text = targetDocument.createElement("div");
    text.className = "toast-message";
    text.textContent = message;
    body.append(text);

    const closeButton = targetDocument.createElement("button");
    closeButton.type = "button";
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "Dismiss notification");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => dismiss(toast));

    toast.append(body, closeButton);
    container.prepend(toast);
    timers.set(
      toast,
      schedule(() => dismiss(toast), timeoutMs),
    );
    return toast;
  };

  return {
    success: (message, title = "Success") => show("success", message, title),
    info: (message, title = "Info") => show("info", message, title),
    warning: (message, title = "Warning") => show("warning", message, title),
    error: (message, title = "Error") => show("error", message, title),
    dismissAll: () => [...container.children].forEach(dismiss),
    container,
  };
};
