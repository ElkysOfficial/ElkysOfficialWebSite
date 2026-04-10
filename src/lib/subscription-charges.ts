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
 * With explicit end date: generates ALL dates from startsOn to endsOn.
 * Without explicit end date: generates from CURRENT MONTH up to 12 months ahead.
 */
export function listSubscriptionDueDates({
  startsOn,
  dueDay,
  endsOn,
}: {
  startsOn: string;
  dueDay: number;
  endsOn?: string | null;
}) {
  if (!startsOn || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return [];

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const hasExplicitEnd = Boolean(endsOn);

  // End boundary: explicit date or 12 months from today
  const effectiveEndsOn = endsOn ?? toIsoDate(getSafeDueDate(nowYear, nowMonth + 12, dueDay));

  // Start boundary: with explicit end, start from subscription start.
  // Without explicit end, start from current month to avoid backfilling history.
  let startDate: string;
  if (hasExplicitEnd) {
    startDate = computeFirstSubscriptionDueDate(startsOn, dueDay);
  } else {
    const subscriptionFirst = computeFirstSubscriptionDueDate(startsOn, dueDay);
    const currentMonthDue = toIsoDate(getSafeDueDate(nowYear, nowMonth, dueDay));
    // Use the later of: subscription first due date OR current month due date
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
