const PAGE_SIZES = Object.freeze([10, 25, 50, 100]);

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

const compareText = (left, right) => collator.compare(left, right);

const comparators = {
  title: (left, right) => compareText(left.title, right.title),
  timestamp: (left, right) => left.timestamp.localeCompare(right.timestamp),
  template: (left, right) =>
    Number(left.isTemplate === true) - Number(right.isTemplate === true),
};

export const SORTABLE_COLUMNS = Object.freeze(Object.keys(comparators));

export const toSnippetRows = (snippets) =>
  Object.entries(snippets).map(([title, snippet]) => ({
    title,
    timestamp: new Date(snippet.timestamp).toISOString(),
    isTemplate: snippet.isTemplate === true,
  }));

export const createSnippetTableModel = ({ pageSize = 10 } = {}) => {
  let rows = [];
  let filter = "";
  let sortColumn = "timestamp";
  let sortDirection = "desc";
  let page = 1;
  let currentPageSize = pageSize;
  let templateSortedBefore = false;

  const visibleRows = () => {
    const normalizedFilter = filter.trim().toLowerCase();
    const matching = normalizedFilter
      ? rows.filter((row) => row.title.toLowerCase().includes(normalizedFilter))
      : [...rows];
    const compare = comparators[sortColumn];
    matching.sort((left, right) =>
      sortDirection === "asc" ? compare(left, right) : compare(right, left),
    );
    return matching;
  };

  const pageCount = () =>
    Math.max(1, Math.ceil(visibleRows().length / currentPageSize));

  const clampPage = () => {
    page = Math.min(Math.max(1, page), pageCount());
  };

  return {
    setRows(nextRows) {
      rows = nextRows.map((row) => ({ ...row }));
      page = 1;
      clampPage();
    },
    setFilter(nextFilter) {
      filter = String(nextFilter ?? "");
      page = 1;
    },
    getFilter: () => filter,
    toggleSort(column) {
      if (!comparators[column]) return;
      if (column === sortColumn) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else if (column === "template" && !templateSortedBefore) {
        // Preserve the original first-click behavior that lists templates first.
        sortDirection = "desc";
      } else {
        sortDirection = "asc";
      }
      if (column === "template") templateSortedBefore = true;
      sortColumn = column;
      page = 1;
    },
    getSort: () => ({ column: sortColumn, direction: sortDirection }),
    setPage(nextPage) {
      page = Number(nextPage) || 1;
      clampPage();
    },
    getPage: () => page,
    getPageCount: pageCount,
    setPageSize(nextSize) {
      const size = Number(nextSize);
      if (!PAGE_SIZES.includes(size)) return;
      currentPageSize = size;
      page = 1;
    },
    getPageSize: () => currentPageSize,
    getPageSizes: () => PAGE_SIZES,
    getPageRows() {
      clampPage();
      const start = (page - 1) * currentPageSize;
      return visibleRows().slice(start, start + currentPageSize);
    },
    getVisibleCount: () => visibleRows().length,
    getTotalCount: () => rows.length,
    getCountLabel() {
      const total = rows.length;
      const visible = visibleRows().length;
      return visible === total ? `${total}` : `${visible}/${total}`;
    },
    getEmptyMessage() {
      if (rows.length === 0) {
        return "No snippets yet. Save the current draft to build your library.";
      }
      if (visibleRows().length === 0) {
        return "No snippets match this search.";
      }
      return "";
    },
  };
};
