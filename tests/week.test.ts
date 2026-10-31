import assert from "node:assert/strict";
import { test } from "node:test";
import { formatWeek, weekOf, weekRange } from "../lib/week";

test("weekOf returns the Monday of the last full week (UTC)", () => {
  assert.equal(weekOf(new Date("2026-11-02T13:00:00Z")), "2026-10-26");
  assert.equal(weekOf(new Date("2026-10-30T10:00:00Z")), "2026-10-19");
});

test("weekOf handles the exact start and end of a week", () => {
  assert.equal(weekOf(new Date("2026-11-08T23:59:59Z")), "2026-10-26");
  assert.equal(weekOf(new Date("2026-11-09T00:00:00Z")), "2026-11-02");
});

test("weekOf works across a year boundary", () => {
  assert.equal(weekOf(new Date("2027-01-04T00:00:00Z")), "2026-12-28");
  assert.equal(weekOf(new Date("2027-01-01T12:00:00Z")), "2026-12-21");
});

test("weekRange covers exactly seven days", () => {
  const { start, end } = weekRange("2026-10-26");
  assert.equal(start.toISOString(), "2026-10-26T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-02T00:00:00.000Z");
});

test("formatWeek handles same month, cross month and cross year", () => {
  assert.equal(formatWeek("2026-11-02"), "Nov 2–8, 2026");
  assert.equal(formatWeek("2026-10-26"), "Oct 26 – Nov 1, 2026");
  assert.equal(formatWeek("2026-12-28"), "Dec 28, 2026 – Jan 3, 2027");
});
