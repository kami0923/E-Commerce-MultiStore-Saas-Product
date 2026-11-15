export const reportRanges = ["30d", "90d", "12m", "all"] as const;

export type ReportRange = (typeof reportRanges)[number];

export function parseReportRange(value: unknown): ReportRange {
  return reportRanges.includes(value as ReportRange) ? value as ReportRange : "12m";
}

export function reportStart(range: ReportRange, now = new Date()) {
  if (range === "all") return undefined;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "30d") start.setDate(start.getDate() - 29);
  if (range === "90d") start.setDate(start.getDate() - 89);
  if (range === "12m") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 11);
  }
  return start;
}

export function csvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function grossProfit(netSalesMinor: number, costMinor: number) {
  const profitMinor = netSalesMinor - costMinor;
  const marginPercent = netSalesMinor > 0 ? Math.round((profitMinor / netSalesMinor) * 1000) / 10 : 0;
  return { profitMinor, marginPercent };
}
