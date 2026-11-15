import assert from "node:assert/strict";
import test from "node:test";
import { csvCell, grossProfit, parseReportRange, reportStart, toCsv } from "../lib/reporting.ts";

test("report ranges reject unknown URL values", () => {
  assert.equal(parseReportRange("30d"), "30d");
  assert.equal(parseReportRange("unexpected"), "12m");
  assert.equal(parseReportRange(undefined), "12m");
});

test("report start creates inclusive fixed windows", () => {
  const now = new Date(2026, 10, 15, 12);
  const dateKey = (value?: Date) => value && `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}-${value.getHours()}`;
  assert.equal(dateKey(reportStart("30d", now)), "2026-10-17-0");
  assert.equal(dateKey(reportStart("90d", now)), "2026-8-18-0");
  assert.equal(dateKey(reportStart("12m", now)), "2025-12-1-0");
  assert.equal(reportStart("all", now), undefined);
});

test("CSV output quotes commas and neutralizes spreadsheet formulas", () => {
  assert.equal(csvCell("AK, Abaya"), '"AK, Abaya"');
  assert.equal(csvCell("=HYPERLINK(\"bad\")"), '"\'=HYPERLINK(""bad"")"');
  const csv = toCsv(["Name", "Value"], [["Store", 12.5]]);
  assert.ok(csv.startsWith("\uFEFFName,Value\r\n"));
  assert.ok(csv.endsWith("Store,12.5\r\n"));
});

test("gross profit reports a one-decimal margin", () => {
  assert.deepEqual(grossProfit(10_000, 6_250), { profitMinor: 3_750, marginPercent: 37.5 });
  assert.deepEqual(grossProfit(0, 0), { profitMinor: 0, marginPercent: 0 });
});
