export const TOKYO_TIME_ZONE = 'Asia/Tokyo';
export const MAX_BOOKINGS_PER_DAY = 5;
export const SLOT_TIMES = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00'
];

const PLAN_OCCUPANCY_MINUTES: Record<string, number> = {
  '3000': 30,
  '4000': 35,
  '6000': 50,
  maedori: 90,
  '\u524d\u64ae\u308a': 90
};

const FIXED_HOLIDAYS = [101, 211, 223, 429, 503, 504, 505, 811, 1103, 1123];

export type AvailabilityStatus = 'circle' | 'triangle' | 'cross';

export type BookingEvent = {
  id: string;
  summary: string;
  description: string;
  startMs: number;
  endMs: number;
};

function createLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toHolidayKey(month: number, day: number) {
  return month * 100 + day;
}

function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, nth: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const delta = (weekday - firstDay.getDay() + 7) % 7;
  return 1 + delta + (nth - 1) * 7;
}

function vernalEquinoxDay(year: number) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function autumnalEquinoxDay(year: number) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getBaseHolidayKeys(year: number) {
  const keys = new Set<number>(FIXED_HOLIDAYS);

  keys.add(toHolidayKey(1, nthWeekdayOfMonth(year, 0, 1, 2)));
  keys.add(toHolidayKey(7, nthWeekdayOfMonth(year, 6, 1, 3)));
  keys.add(toHolidayKey(9, nthWeekdayOfMonth(year, 8, 1, 3)));
  keys.add(toHolidayKey(10, nthWeekdayOfMonth(year, 9, 1, 2)));
  keys.add(toHolidayKey(3, vernalEquinoxDay(year)));
  keys.add(toHolidayKey(9, autumnalEquinoxDay(year)));

  return keys;
}

function isBaseHoliday(date: Date) {
  const keys = getBaseHolidayKeys(date.getFullYear());
  return keys.has(toHolidayKey(date.getMonth() + 1, date.getDate()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isSunday(date: Date) {
  return date.getDay() === 0;
}

export function isJapaneseHoliday(dateString: string) {
  const date = createLocalDate(dateString);
  const baseHolidays = getBaseHolidayKeys(date.getFullYear());
  const currentKey = toHolidayKey(date.getMonth() + 1, date.getDate());

  if (baseHolidays.has(currentKey)) {
    return true;
  }

  const previousDay = addDays(date, -1);
  const nextDay = addDays(date, 1);
  if (isBaseHoliday(previousDay) && isBaseHoliday(nextDay)) {
    return true;
  }

  let cursor = addDays(date, -1);
  while (isSunday(cursor) || isBaseHoliday(cursor)) {
    if (isSunday(cursor)) {
      return true;
    }
    cursor = addDays(cursor, -1);
  }

  return false;
}

export function isBusinessDay(dateString: string) {
  const date = createLocalDate(dateString);
  const day = date.getDay();
  return day === 3 || day === 4 || day === 5 || day === 6 || day === 0 || isJapaneseHoliday(dateString);
}

export function isSupportedPlan(plan: string) {
  return Object.prototype.hasOwnProperty.call(PLAN_OCCUPANCY_MINUTES, plan);
}

export function getPlanOccupancyMinutes(plan: string) {
  const minutes = PLAN_OCCUPANCY_MINUTES[plan];

  if (!minutes) {
    throw new Error('Unsupported plan');
  }

  return minutes;
}

export function formatTokyoDateTime(dateString: string, time: string) {
  return `${dateString}T${time}:00+09:00`;
}

export function toTimestamp(dateString: string, time: string) {
  return new Date(formatTokyoDateTime(dateString, time)).getTime();
}

function formatTimestampInTokyo(timestamp: number) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TOKYO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(timestamp));

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+09:00`;
}

export function createDayWindow(dateString: string) {
  return {
    timeMin: `${dateString}T00:00:00+09:00`,
    timeMax: `${dateString}T23:59:59+09:00`
  };
}

export function createMonthWindow(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const end = `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-01`;

  return {
    timeMin: `${start}T00:00:00+09:00`,
    timeMax: `${end}T00:00:00+09:00`
  };
}

export function splitEventsByDate(events: BookingEvent[]) {
  const map = new Map<string, BookingEvent[]>();

  for (const event of events) {
    const dateKey = new Intl.DateTimeFormat('sv-SE', {
      timeZone: TOKYO_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(event.startMs));

    const current = map.get(dateKey) || [];
    current.push(event);
    map.set(dateKey, current);
  }

  return map;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

export function generateAvailableSlots(dateString: string, events: BookingEvent[], plan = '3000') {
  if (!isBusinessDay(dateString)) {
    return [];
  }

  if (!isSupportedPlan(plan)) {
    throw new Error('Unsupported plan');
  }

  if (events.length >= MAX_BOOKINGS_PER_DAY) {
    return [];
  }

  const occupancyMinutes = getPlanOccupancyMinutes(plan);

  return SLOT_TIMES.filter((time) => {
    const slotStart = toTimestamp(dateString, time);
    const slotEnd = slotStart + occupancyMinutes * 60 * 1000;

    return events.every((event) => !overlaps(slotStart, slotEnd, event.startMs, event.endMs));
  });
}

export function getAvailabilityStatus(count: number, slots: string[]): AvailabilityStatus {
  if (count >= MAX_BOOKINGS_PER_DAY || slots.length === 0) {
    return 'cross';
  }

  if (count >= 3) {
    return 'triangle';
  }

  return 'circle';
}

export function buildReservationId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `makotoya-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCalendarEventDetails(input: {
  reservationId: string;
  plan: string;
  name: string;
  phone: string;
  people: number;
  note?: string;
  date: string;
  time: string;
}) {
  const durationMinutes = getPlanOccupancyMinutes(input.plan);
  const startDateTime = formatTokyoDateTime(input.date, input.time);
  const endDateTime = formatTimestampInTokyo(toTimestamp(input.date, input.time) + durationMinutes * 60 * 1000);

  return {
    summary: `\u4eba\u529b\u8eca\u4e88\u7d04\uff5c${input.plan}\uff5c${input.name}`,
    description: [
      `\u540d\u524d\uff1a${input.name}`,
      `\u96fb\u8a71\uff1a${input.phone}`,
      `\u4eba\u6570\uff1a${input.people}\u540d`,
      `\u5099\u8003\uff1a${input.note || '\u306a\u3057'}`,
      `\u4e88\u7d04ID\uff1a${input.reservationId}`
    ].join('\n'),
    startDateTime,
    endDateTime
  };
}

export function buildLineNotificationText(input: {
  reservationId: string;
  plan: string;
  name: string;
  phone: string;
  people: number;
  note?: string;
  date: string;
  time: string;
}) {
  return [
    '\u3010\u4eba\u529b\u8eca \u65b0\u898f\u4e88\u7d04\u3011',
    `\u4e88\u7d04ID\uff1a${input.reservationId}`,
    `\u30d7\u30e9\u30f3\uff1a${input.plan}`,
    `\u304a\u540d\u524d\uff1a${input.name}`,
    `\u65e5\u6642\uff1a${input.date} ${input.time}`,
    `\u4eba\u6570\uff1a${input.people}\u540d`,
    `\u96fb\u8a71\uff1a${input.phone}`,
    `\u5099\u8003\uff1a${input.note || '\u306a\u3057'}`
  ].join('\n');
}
