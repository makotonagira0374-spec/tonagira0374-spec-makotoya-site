import { handleOptions, setCorsHeaders } from './_lib/cors';
import { listCalendarEvents } from './_lib/google-calendar';
import {
  buildReservationId,
  createMonthWindow,
  generateAvailableSlots,
  getAvailabilityStatus,
  isBusinessDay,
  isSupportedPlan,
  splitEventsByDate
} from './_lib/booking';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res, ['GET', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['GET', 'OPTIONS']);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const year = Number(req.query.year);
  const month = Number(req.query.month);
  const plan = typeof req.query.plan === 'string' ? req.query.plan : '3000';

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  if (!isSupportedPlan(plan)) {
    return res.status(400).json({ error: 'Unsupported plan' });
  }

  try {
    const { timeMin, timeMax } = createMonthWindow(year, month);
    const events = await listCalendarEvents(timeMin, timeMax);
    const eventsByDate = splitEventsByDate(events);
    const daysInMonth = new Date(year, month, 0).getDate();
    const response: Record<string, { status: string; count: number; slots: string[] }> = {};

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(dateKey) || [];
      const slots = isBusinessDay(dateKey) ? generateAvailableSlots(dateKey, dayEvents, plan) : [];

      response[dateKey] = {
        status: getAvailabilityStatus(dayEvents.length, slots),
        count: dayEvents.length,
        slots
      };
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: buildReservationId()
    });
  }
}
