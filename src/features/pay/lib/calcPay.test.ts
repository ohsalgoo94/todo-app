import { describe, expect, test } from "vitest";
import { applyTaxDeduction, calcMonthlyPay, type PayOptions, type PayRecords } from "./calcPay";

const OFF: PayOptions = { weeklyHolidayPay: false, overtimePay: false, nightPay: false, taxDeduction: false };
const ON: PayOptions = { weeklyHolidayPay: true, overtimePay: true, nightPay: true, taxDeduction: true };

function record(minutes: number, nightMinutes = 0): PayRecords[string] {
  return { minutes, nightMinutes };
}

describe("calcMonthlyPay - 기본급", () => {
  test("2026년 9월, 하루 4시간 30분, 모두 꺼짐 → 46,440원", () => {
    const records: PayRecords = { "2026-09-10": record(270) };
    expect(calcMonthlyPay(records, 2026, 9, OFF).grossPay).toBe(46440);
  });

  test("2026년 9월, 4시간+5시간30분+2시간15분, 모두 꺼짐 → 총 11시간45분, 121,260원", () => {
    const records: PayRecords = {
      "2026-09-01": record(240),
      "2026-09-02": record(330),
      "2026-09-03": record(135),
    };
    const result = calcMonthlyPay(records, 2026, 9, OFF);
    expect(result.totalMinutes).toBe(705);
    expect(result.grossPay).toBe(121260);
  });

  test("2027년 1월 4일, 1시간, 모두 꺼짐 → 10,700원", () => {
    const records: PayRecords = { "2027-01-04": record(60) };
    expect(calcMonthlyPay(records, 2027, 1, OFF).grossPay).toBe(10700);
  });

  test("2027년 1월, 5분, 모두 꺼짐 → 891원 (원 미만 버림)", () => {
    const records: PayRecords = { "2027-01-04": record(5) };
    expect(calcMonthlyPay(records, 2027, 1, OFF).grossPay).toBe(891);
  });

  test("근무 기록 없는 달, 모두 켜짐 → 0시간, 0원", () => {
    const result = calcMonthlyPay({}, 2026, 9, ON);
    expect(result.totalMinutes).toBe(0);
    expect(result.grossPay).toBe(0);
  });
});

describe("calcMonthlyPay - 주휴수당 (2026-09-07 ~ 09-13 주)", () => {
  test("한 주 총 20시간 → 주휴수당 41,280원", () => {
    const records: PayRecords = { "2026-09-08": record(20 * 60) };
    expect(calcMonthlyPay(records, 2026, 9, { ...OFF, weeklyHolidayPay: true }).weeklyHolidayPay).toBe(41280);
  });

  test("한 주 총 14시간 → 주휴수당 0원", () => {
    const records: PayRecords = { "2026-09-08": record(14 * 60) };
    expect(calcMonthlyPay(records, 2026, 9, { ...OFF, weeklyHolidayPay: true }).weeklyHolidayPay).toBe(0);
  });

  test("한 주 총 45시간 → 주휴수당 82,560원 (40시간으로 제한)", () => {
    const records: PayRecords = { "2026-09-08": record(45 * 60) };
    expect(calcMonthlyPay(records, 2026, 9, { ...OFF, weeklyHolidayPay: true }).weeklyHolidayPay).toBe(82560);
  });
});

describe("calcMonthlyPay - 연장 가산수당 (2026-09-14 월 ~ 09-20 일 주)", () => {
  test("하루 10시간 (그 주 다른 근무 없음) → 기본급 103,200 + 연장 가산 10,320", () => {
    const records: PayRecords = { "2026-09-14": record(10 * 60) };
    const result = calcMonthlyPay(records, 2026, 9, { ...OFF, overtimePay: true });
    expect(result.basePay).toBe(103200);
    expect(result.overtimePay).toBe(10320);
  });

  test("월~금 매일 9시간 → 연장 5시간, 가산 25,800원", () => {
    const records: PayRecords = {
      "2026-09-14": record(9 * 60),
      "2026-09-15": record(9 * 60),
      "2026-09-16": record(9 * 60),
      "2026-09-17": record(9 * 60),
      "2026-09-18": record(9 * 60),
    };
    expect(calcMonthlyPay(records, 2026, 9, { ...OFF, overtimePay: true }).overtimePay).toBe(25800);
  });

  test("월~토 매일 8시간 → 연장 8시간, 가산 41,280원", () => {
    const records: PayRecords = {
      "2026-09-14": record(8 * 60),
      "2026-09-15": record(8 * 60),
      "2026-09-16": record(8 * 60),
      "2026-09-17": record(8 * 60),
      "2026-09-18": record(8 * 60),
      "2026-09-19": record(8 * 60),
    };
    expect(calcMonthlyPay(records, 2026, 9, { ...OFF, overtimePay: true }).overtimePay).toBe(41280);
  });
});

describe("calcMonthlyPay - 야간 가산수당", () => {
  test("하루 6시간 중 야간 2시간, 야간 켬 → 기본급 61,920 + 야간 가산 10,320", () => {
    const records: PayRecords = { "2026-09-10": record(6 * 60, 2 * 60) };
    const result = calcMonthlyPay(records, 2026, 9, { ...OFF, nightPay: true });
    expect(result.basePay).toBe(61920);
    expect(result.nightPay).toBe(10320);
  });

  test("같은 기록, 야간 끔 → 61,920원 (야간 기록은 남아 있음)", () => {
    const records: PayRecords = { "2026-09-10": record(6 * 60, 2 * 60) };
    const result = calcMonthlyPay(records, 2026, 9, OFF);
    expect(result.grossPay).toBe(61920);
  });
});

describe("applyTaxDeduction - 3.3% 공제", () => {
  test("세전 1,000,000원 → 공제 33,000원, 공제 후 967,000원", () => {
    expect(applyTaxDeduction(1_000_000)).toEqual({ taxAmount: 33000, netPay: 967000 });
  });
});
