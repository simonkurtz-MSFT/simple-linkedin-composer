import {
  SORTABLE_COLUMNS,
  createSnippetTableModel,
  toSnippetRows,
} from "./snippet-table-model.js";

const ARIA_SORT = { asc: "ascending", desc: "descending" };

const formatTimestamp = (isoTimestamp) =>
  new Date(isoTimestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const createElement = (document, tagName, { className, text, attrs } = {}) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  Object.entries(attrs ?? {}).forEach(([name, value]) =>
    element.setAttribute(name, value),
  );
  return element;
};

export const createSnippetTable = ({
  table,
  searchInput,
  templateFilter,
  pager,
  pageSizeSelect,
  onLoad,
  onDelete,
  onCountChange = () => {},
  pageSize = 10,
}) => {
  const document = table.ownerDocument;
  const model = createSnippetTableModel({ pageSize });
  const body = table.tBodies[0] ?? table.createTBody();
  const headers = [...table.tHead.querySelectorAll("th[data-sort]")];
  const columnCount = table.tHead.rows[0].cells.length;

  const renderHeaders = () => {
    const { column, direction } = model.getSort();
    headers.forEach((header) => {
      const isActive = header.dataset.sort === column;
      if (isActive) {
        header.setAttribute("aria-sort", ARIA_SORT[direction]);
      } else {
        header.removeAttribute("aria-sort");
      }
      header.querySelector("button")?.classList.toggle("is-active", isActive);
    });
  };

  const renderRows = () => {
    body.replaceChildren();
    const emptyMessage = model.getEmptyMessage();
    if (emptyMessage) {
      const row = document.createElement("tr");
      row.append(
        createElement(document, "td", {
          className: "empty-state",
          text: emptyMessage,
          attrs: { colspan: String(columnCount) },
        }),
      );
      body.append(row);
      return;
    }

    model.getPageRows().forEach((snippet) => {
      const row = document.createElement("tr");

      const loadButton = createElement(document, "button", {
        className: "snippet-link",
        text: snippet.title,
        attrs: { type: "button" },
      });
      loadButton.addEventListener("click", () => onLoad(snippet.title));

      const timestamp = createElement(document, "time", {
        text: formatTimestamp(snippet.timestamp),
        attrs: { datetime: snippet.timestamp },
      });

      const template = createElement(document, "span", {
        text: snippet.isTemplate ? "✔" : "",
        attrs: snippet.isTemplate
          ? { "aria-label": "Template", title: "Template" }
          : {},
      });

      const deleteButton = createElement(document, "button", {
        className: "delete-snippet",
        text: "🗑",
        attrs: {
          type: "button",
          "aria-label": `Delete ${snippet.title}`,
          title: `Delete ${snippet.title}`,
        },
      });
      deleteButton.addEventListener("click", () => onDelete(snippet.title));

      [loadButton, timestamp, template, deleteButton].forEach((content) => {
        const cell = document.createElement("td");
        cell.append(content);
        row.append(cell);
      });
      body.append(row);
    });
  };

  const renderPager = () => {
    if (!pager) return;
    pager.replaceChildren();
    const pageCount = model.getPageCount();
    const current = model.getPage();
    if (pageCount <= 1) {
      pager.hidden = true;
      return;
    }
    pager.hidden = false;

    const addButton = (label, targetPage, { ariaLabel, isCurrent } = {}) => {
      const button = createElement(document, "button", {
        className: "pager-button",
        text: label,
        attrs: { type: "button" },
      });
      if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
      if (isCurrent) button.setAttribute("aria-current", "page");
      button.disabled = targetPage < 1 || targetPage > pageCount || isCurrent;
      button.addEventListener("click", () => {
        model.setPage(targetPage);
        render();
      });
      pager.append(button);
    };

    addButton("‹", current - 1, { ariaLabel: "Previous page" });
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      addButton(String(pageNumber), pageNumber, {
        ariaLabel: `Page ${pageNumber}`,
        isCurrent: pageNumber === current,
      });
    }
    addButton("›", current + 1, { ariaLabel: "Next page" });
  };

  const render = () => {
    renderHeaders();
    renderRows();
    renderPager();
    onCountChange(model.getCountLabel(), {
      visible: model.getVisibleCount(),
      total: model.getTotalCount(),
    });
  };

  headers.forEach((header) => {
    const column = header.dataset.sort;
    if (!SORTABLE_COLUMNS.includes(column)) return;
    header.querySelector("button")?.addEventListener("click", () => {
      model.toggleSort(column);
      render();
    });
  });

  searchInput?.addEventListener("input", () => {
    model.setFilter(searchInput.value);
    render();
  });

  templateFilter?.addEventListener("change", () => {
    model.setTemplatesOnly(templateFilter.checked);
    render();
  });

  if (pageSizeSelect) {
    pageSizeSelect.replaceChildren(
      ...model.getPageSizes().map((size) =>
        createElement(document, "option", {
          text: String(size),
          attrs: { value: String(size) },
        }),
      ),
    );
    pageSizeSelect.value = String(model.getPageSize());
    pageSizeSelect.addEventListener("change", () => {
      model.setPageSize(pageSizeSelect.value);
      render();
    });
  }

  return {
    setSnippets(snippets) {
      model.setRows(toSnippetRows(snippets));
      render();
    },
    render,
    model,
  };
};
