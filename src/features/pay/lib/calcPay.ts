import { eachDayOfInterval, endOfMonth, endOfWeek, format, getYear, parseISO, startOfMonth, startOfWeek } from "date-fns";
import minimumWage from "../data/minimumWage.json";

export type WorkRecord = { minutes: number; nightMinutes: number };
export type PayRecords = Record<string, WorkRecord>; // "yyyy-MM-dd" -> 그날 근무 기록

export type PayOptions = {
  weeklyHolidayPay: boolean;
  overtimePay: boolean;
  nightPay: boolean;
  taxDeduction: boolean;
};

export type PayResult = {
  totalMinutes: number;
  appliedWage: number;
  appliedWageYear: number;
  missingWageNote: string | null;
  basePay: number;
  weeklyHolidayPay: number;
  overtimePay: number;
  nightPay: number;
  grossPay: number;
  taxAmount: number;
  netPay: number;
};

const WEEK_STARTS_ON_MONDAY = 1;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY_STANDARD = 8 * 60;
const MINUTES_PER_WEEK_STANDARD = 40 * 60;
const WEEKLY_HOLIDAY_MIN_MINUTES = 15 * 60;
const TAX_RATE = 0.033;

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function getWageForYear(year: number): { wage: number; usedYear: number } {
  const table = minimumWage as Record<string, number>;
  const key = String(year);
  if (key in table) return { wage: table[key], usedYear: year };
  // json에 없는 연도는 가장 최근(가장 큰) 연도 값을 쓴다
  const latestYear = Math.max(...Object.keys(table).map(Number));
  return { wage: table[String(latestYear)], usedYear: latestYear };
}

export function applyTaxDeduction(grossPay: number): { taxAmount: number; netPay: number } {
  const taxAmount = Math.floor(grossPay * TAX_RATE);
  return { taxAmount, netPay: grossPay - taxAmount };
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

// 한 달치 월급을 계산한다. records는 이 달 밖의 날짜(주가 걸친 경우 대비)까지 포함된 전체 기록을 받는다.
export function calcMonthlyPay(records: PayRecords, year: number, month: number, options: PayOptions): PayResult {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const monthDayKeys = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(toDateKey);

  const { wage: monthWage, usedYear: monthWageYear } = getWageForYear(year);
  const missingWageNote =
    monthWageYear !== year ? `${year}년 최저시급 정보가 없어 ${monthWageYear}년 기준으로 계산했어요` : null;

  // 기본급: 이 달에 속한 날짜만, 연도별로 묶어 계산 후 각각 원 미만을 버리고 합산
  let totalMinutes = 0;
  const minutesByYear = new Map<number, number>();
  for (const dateKey of monthDayKeys) {
    const minutes = records[dateKey]?.minutes ?? 0;
    if (minutes <= 0) continue;
    totalMinutes += minutes;
    const y = getYear(parseISO(dateKey));
    minutesByYear.set(y, (minutesByYear.get(y) ?? 0) + minutes);
  }
  let basePay = 0;
  for (const [y, minutes] of minutesByYear) {
    const { wage } = getWageForYear(y);
    basePay += Math.floor((minutes * wage) / MINUTES_PER_HOUR);
  }

  // 주휴수당 / 연장 가산수당: 일요일이 이 달에 속하는 주만, 월~일 전체를 기준으로 계산
  let weeklyHolidayPayRaw = 0;
  let overtimePayRaw = 0;
  if (options.weeklyHolidayPay || options.overtimePay) {
    const seenWeekEndKeys = new Set<string>();
    for (const dateKey of monthDayKeys) {
      const date = parseISO(dateKey);
      const weekEnd = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON_MONDAY });
      if (weekEnd.getFullYear() !== monthStart.getFullYear() || weekEnd.getMonth() !== monthStart.getMonth()) {
        continue; // 이 주의 일요일이 다음 달이면, 그 주는 다음 달 계산에서 처리한다
      }
      const weekEndKey = toDateKey(weekEnd);
      if (seenWeekEndKeys.has(weekEndKey)) continue;
      seenWeekEndKeys.add(weekEndKey);

      const weekStart = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON_MONDAY });
      const weekDayKeys = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(toDateKey);

      let weeklyMinutes = 0;
      let dailyOvertimeSum = 0;
      for (const wk of weekDayKeys) {
        const minutes = records[wk]?.minutes ?? 0;
        weeklyMinutes += minutes;
        dailyOvertimeSum += Math.max(0, minutes - MINUTES_PER_DAY_STANDARD);
      }

      const { wage: weekWage } = getWageForYear(getYear(weekEnd));

      if (options.weeklyHolidayPay && weeklyMinutes >= WEEKLY_HOLIDAY_MIN_MINUTES) {
        weeklyHolidayPayRaw +=
          (Math.min(weeklyMinutes, MINUTES_PER_WEEK_STANDARD) / MINUTES_PER_WEEK_STANDARD) * 8 * weekWage;
      }
      if (options.overtimePay) {
        const weeklyOvertime = Math.max(0, weeklyMinutes - dailyOvertimeSum - MINUTES_PER_WEEK_STANDARD);
        const totalOvertimeMinutes = dailyOvertimeSum + weeklyOvertime;
        overtimePayRaw += (totalOvertimeMinutes / MINUTES_PER_HOUR) * weekWage * 0.5;
      }
    }
  }
  const weeklyHolidayPayAmount = options.weeklyHolidayPay ? Math.floor(weeklyHolidayPayRaw) : 0;
  const overtimePayAmount = options.overtimePay ? Math.floor(overtimePayRaw) : 0;

  // 야간 가산수당: 이 달 날짜별 야간 근무 시간 합계
  let nightPayAmount = 0;
  if (options.nightPay) {
    let totalNightMinutes = 0;
    for (const dateKey of monthDayKeys) {
      totalNightMinutes += records[dateKey]?.nightMinutes ?? 0;
    }
    nightPayAmount = Math.floor((totalNightMinutes / MINUTES_PER_HOUR) * monthWage * 0.5);
  }

  const grossPay = basePay + weeklyHolidayPayAmount + overtimePayAmount + nightPayAmount;
  const { taxAmount, netPay } = options.taxDeduction
    ? applyTaxDeduction(grossPay)
    : { taxAmount: 0, netPay: grossPay };

  return {
    totalMinutes,
    appliedWage: monthWage,
    appliedWageYear: monthWageYear,
    missingWageNote,
    basePay,
    weeklyHolidayPay: weeklyHolidayPayAmount,
    overtimePay: overtimePayAmount,
    nightPay: nightPayAmount,
    grossPay,
    taxAmount,
    netPay,
  };
}
