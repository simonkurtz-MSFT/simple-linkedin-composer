// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNotifier } from "../src/notifications.js";

describe("notifications", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  it("creates a container once and renders levels with correct live-region semantics", () => {
    const notifier = createNotifier();
    const again = createNotifier();
    expect(document.querySelectorAll("#toast-container")).toHaveLength(1);
    expect(again.container).toBe(notifier.container);

    const success = notifier.success("Saved");
    const error = notifier.error("Failed", "Problem");

    expect(success.className).toBe("toast toast-success");
    expect(success.getAttribute("role")).toBe("status");
    expect(success.getAttribute("aria-live")).toBe("polite");
    expect(success.querySelector(".toast-title").textContent).toBe("Success");
    expect(success.querySelector(".toast-message").textContent).toBe("Saved");

    expect(error.getAttribute("role")).toBe("alert");
    expect(error.getAttribute("aria-live")).toBe("assertive");
    expect(error.querySelector(".toast-title").textContent).toBe("Problem");
    expect(notifier.info("i").className).toContain("toast-info");
    expect(notifier.warning("w").getAttribute("aria-live")).toBe("assertive");
  });

  it("places the newest toast first and suppresses duplicates", () => {
    const notifier = createNotifier();
    notifier.success("First");
    notifier.success("Second");
    expect(
      [...notifier.container.children].map(
        (toast) => toast.querySelector(".toast-message").textContent,
      ),
    ).toEqual(["Second", "First"]);

    expect(notifier.success("Second")).toBeNull();
    expect(notifier.container.children).toHaveLength(2);
    expect(notifier.success("Second", "Other title")).not.toBeNull();
  });

  it("escapes message content as text", () => {
    const notifier = createNotifier();
    const toast = notifier.info("<img src=x onerror=alert(1)>");
    expect(toast.querySelector("img")).toBeNull();
    expect(toast.querySelector(".toast-message").textContent).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("dismisses on timeout, on close, and on dismissAll", () => {
    const notifier = createNotifier({ timeoutMs: 500 });
    const timed = notifier.success("Timed");
    vi.advanceTimersByTime(499);
    expect(timed.isConnected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(timed.isConnected).toBe(false);

    const closed = notifier.error("Closed");
    closed.querySelector(".toast-close").click();
    expect(closed.isConnected).toBe(false);
    vi.advanceTimersByTime(1000);

    notifier.info("A");
    notifier.info("B");
    notifier.dismissAll();
    expect(notifier.container.children).toHaveLength(0);
  });
});
