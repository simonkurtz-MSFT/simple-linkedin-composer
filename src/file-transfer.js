export const downloadFile = (
  filename,
  content,
  {
    document: targetDocument = globalThis.document,
    type = "application/json",
  } = {},
) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = targetDocument.createElement("a");
  link.href = url;
  link.download = filename;
  targetDocument.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const pickFile = ({
  accept = "application/json",
  document: targetDocument = globalThis.document,
} = {}) =>
  new Promise((resolve) => {
    const input = targetDocument.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.addEventListener("change", () => resolve(input.files?.[0] ?? null), {
      once: true,
    });
    input.click();
  });
