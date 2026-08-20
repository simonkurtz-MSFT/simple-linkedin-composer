export const setupAccordions = (root = globalThis.document) => {
  root.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.parentElement.querySelector(".accordion-content");
      if (!content) return;
      const isOpen = content.classList.toggle("open");
      header.setAttribute("aria-expanded", String(isOpen));
    });
  });
};

export const openAccordion = (content) => {
  content.classList.add("open");
  content.parentElement
    .querySelector(".accordion-header")
    ?.setAttribute("aria-expanded", "true");
};
