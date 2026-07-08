import type { Column } from "@/components/shared/data-table";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTableCsv<T>(
  filename: string,
  columns: Column<T>[],
  data: T[]
): void {
  const exportCols = columns.filter((c) => c.key !== "actions");
  const header = exportCols.map((c) => escapeCsvCell(c.header)).join(",");
  const rows = data.map((row) =>
    exportCols
      .map((col) => {
        const cell = col.cell(row);
        const text =
          typeof cell === "string" || typeof cell === "number"
            ? String(cell)
            : "";
        return escapeCsvCell(text);
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
