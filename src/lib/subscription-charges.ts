/** Build a UTC date clamping dueDay to the last day of the month. */
function getSafeDueDate(year: number, month: number, dueDay: number) {
  const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const safeDay = Math.min(dueDay, maxDay);
  return new Date(Date.UTC(year, month, safeDay));
}

/** Format a UTC Date as YYYY-MM-DD string. */
function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function computeFirstSubscriptionDueDate(startsOn: string, dueDay: number) {
  const [y, m, d] = startsOn.split("-").map(Number);
  const srcYear = y;
  const srcMonth = m - 1;
  const srcDay = d;

  const sameMonth = getSafeDueDate(srcYear, srcMonth, dueDay);

  if (srcDay <= sameMonth.getUTCDate()) return toIsoDate(sameMonth);

  const nextMonth = getSafeDueDate(srcYear, srcMonth + 1, dueDay);
  return toIsoDate(nextMonth);
}

export function getSubscriptionCoverageEnd(
  subscriptionEndsOn?: string | null,
  contractEndsAt?: string | null
) {
  if (subscriptionEndsOn && contractEndsAt) {
    return subscriptionEndsOn < contractEndsAt ? subscriptionEndsOn : contractEndsAt;
  }

  return subscriptionEndsOn ?? contractEndsAt ?? null;
}

/**
 * Generate due dates for a subscription within its coverage window.
 *
 * `mode` is REQUIRED and controls backfill semantics:
 * - `"create"`: used when creating a project. Generates ALL dates from `startsOn`
 *   (or current month, when no explicit `endsOn`) up to the coverage end. May
 *   backfill historical dates — appropriate only for first-time creation of a
 *   project that legitimately started in the past.
 * - `"sync"`: used by background reconciliation flows (ProjectDetail/Finance auto-sync).
 *   NEVER generates dates before the first day of the current month, even with an
 *   explicit `endsOn`. This guarantees that historical charges deleted by an admin
 *   are not silently resurrected on the next page load.
 */
export function listSubscriptionDueDates({
  startsOn,
  dueDay,
  endsOn,
  mode,
}: {
  startsOn: string;
  dueDay: number;
  endsOn?: string | null;
  mode: "create" | "sync";
}) {
  if (!startsOn || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return [];

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const hasExplicitEnd = Boolean(endsOn);

  // End boundary: explicit date or 12 months from today
  const effectiveEndsOn = endsOn ?? toIsoDate(getSafeDueDate(nowYear, nowMonth + 12, dueDay));

  // Start boundary depends on mode.
  const subscriptionFirst = computeFirstSubscriptionDueDate(startsOn, dueDay);
  const currentMonthDue = toIsoDate(getSafeDueDate(nowYear, nowMonth, dueDay));

  let startDate: string;
  if (mode === "create" && hasExplicitEnd) {
    // Creation flow with bounded coverage: honor the historical start date.
    startDate = subscriptionFirst;
  } else {
    // sync mode (always) OR create mode without explicit end:
    // floor the start at the current month's due date so history is never resurrected.
    startDate = subscriptionFirst > currentMonthDue ? subscriptionFirst : currentMonthDue;
  }

  if (startDate > effectiveEndsOn) return [];

  const dueDates = [startDate];
  const [sy, sm] = startDate.split("-").map(Number);
  let cursorYear = sy;
  let cursorMonth = sm - 1;

  while (true) {
    cursorMonth += 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
    const nextDueDate = toIsoDate(getSafeDueDate(cursorYear, cursorMonth, dueDay));
    if (nextDueDate > effectiveEndsOn) break;
    dueDates.push(nextDueDate);
  }

  return dueDates;
}
