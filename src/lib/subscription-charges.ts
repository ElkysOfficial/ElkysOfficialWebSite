function getSafeDueDate(year: number, month: number, dueDay: number) {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(dueDay, maxDay);
  return new Date(year, month, safeDay, 12);
}

export function computeFirstSubscriptionDueDate(startsOn: string, dueDay: number) {
  const source = startsOn ? new Date(`${startsOn}T12:00:00`) : new Date();
  const sameMonth = getSafeDueDate(source.getFullYear(), source.getMonth(), dueDay);

  if (source.getDate() <= sameMonth.getDate()) return sameMonth.toISOString().slice(0, 10);

  const nextMonth = getSafeDueDate(source.getFullYear(), source.getMonth() + 1, dueDay);
  return nextMonth.toISOString().slice(0, 10);
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
  const hasExplicitEnd = Boolean(endsOn);

  // End boundary: explicit date or 12 months from today
  const effectiveEndsOn =
    endsOn ??
    getSafeDueDate(now.getFullYear(), now.getMonth() + 12, dueDay)
      .toISOString()
      .slice(0, 10);

  // Start boundary: with explicit end, start from subscription start.
  // Without explicit end, start from current month to avoid backfilling history.
  let startDate: string;
  if (hasExplicitEnd) {
    startDate = computeFirstSubscriptionDueDate(startsOn, dueDay);
  } else {
    const subscriptionFirst = computeFirstSubscriptionDueDate(startsOn, dueDay);
    const currentMonthDue = getSafeDueDate(now.getFullYear(), now.getMonth(), dueDay)
      .toISOString()
      .slice(0, 10);
    // Use the later of: subscription first due date OR current month due date
    startDate = subscriptionFirst > currentMonthDue ? subscriptionFirst : currentMonthDue;
  }

  if (startDate > effectiveEndsOn) return [];

  const dueDates = [startDate];
  let cursor = new Date(`${startDate}T12:00:00`);

  while (true) {
    const nextMonth = getSafeDueDate(cursor.getFullYear(), cursor.getMonth() + 1, dueDay);
    const nextDueDate = nextMonth.toISOString().slice(0, 10);
    if (nextDueDate > effectiveEndsOn) break;
    dueDates.push(nextDueDate);
    cursor = nextMonth;
  }

  return dueDates;
}
