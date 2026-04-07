import { handleOptions, setCorsHeaders } from './_lib/cors';
import { sendLineTextMessage } from './_lib/line';
import { createCalendarEvent, listCalendarEvents } from './_lib/google-calendar';
import {
  buildCalendarEventDetails,
  buildLineNotificationText,
  buildReservationId,
  createDayWindow,
  generateAvailableSlots,
  isBusinessDay,
  isSupportedPlan,
  SLOT_TIMES
} from './_lib/booking';

export default async function handler(req: any, res: any) {
  if (handleOptions(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  setCorsHeaders(req, res, ['POST', 'OPTIONS']);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    date = '',
    time = '',
    plan = '',
    name = '',
    phone = '',
    people,
    note = ''
  } = req.body || {};

  if (!date || !time || !plan || !name || !phone || !people) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!SLOT_TIMES.includes(time)) {
    return res.status(400).json({ error: 'Invalid time slot' });
  }

  if (!isSupportedPlan(String(plan))) {
    return res.status(400).json({ error: 'Unsupported plan' });
  }

  if (!isBusinessDay(date)) {
    return res.status(409).json({ error: 'Selected date is not a business day' });
  }

  try {
    const { timeMin, timeMax } = createDayWindow(date);
    const existingEvents = await listCalendarEvents(timeMin, timeMax);
    const availableSlots = generateAvailableSlots(date, existingEvents, String(plan));

    if (!availableSlots.includes(time)) {
      return res.status(409).json({
        error: 'Selected time is no longer available',
        slots: availableSlots,
        count: existingEvents.length
      });
    }

    const reservationId = buildReservationId();
    const eventPayload = buildCalendarEventDetails({
      reservationId,
      plan: String(plan),
      name: String(name),
      phone: String(phone),
      people: Number(people),
      note: String(note || ''),
      date: String(date),
      time: String(time)
    });

    const calendarEvent = await createCalendarEvent(eventPayload);

    let lineNotified = true;
    let lineError = '';

    try {
      await sendLineTextMessage(
        buildLineNotificationText({
          reservationId,
          plan: String(plan),
          name: String(name),
          phone: String(phone),
          people: Number(people),
          note: String(note || ''),
          date: String(date),
          time: String(time)
        })
      );
    } catch (error) {
      lineNotified = false;
      lineError = error instanceof Error ? error.message : 'LINE notification failed';
    }

    return res.status(201).json({
      ok: true,
      success: true,
      reservationId,
      eventId: calendarEvent.id,
      calendarUrl: calendarEvent.htmlLink,
      lineNotified,
      lineError
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
