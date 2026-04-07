import { randomUUID } from 'node:crypto';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const TOKYO_TIME_ZONE = 'Asia/Tokyo';

type AccessTokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: AccessTokenCache | null = null;

export type CalendarBookingEvent = {
  id: string;
  summary: string;
  description: string;
  startMs: number;
  endMs: number;
  allDay: boolean;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

async function getGoogleAccessToken() {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET');
  const refreshToken = getRequiredEnv('GOOGLE_REFRESH_TOKEN');

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google token request failed: ${details || response.status}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Google token response did not include access_token');
  }

  tokenCache = {
    accessToken: data.access_token as string,
    expiresAt: now + Number(data.expires_in || 3600) * 1000
  };

  return tokenCache.accessToken;
}

async function calendarRequest(path: string, init: RequestInit = {}) {
  const calendarId = encodeURIComponent(getRequiredEnv('GOOGLE_CALENDAR_ID'));
  const token = await getGoogleAccessToken();
  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${calendarId}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Calendar API failed: ${details || response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function toCalendarBookingEvent(item: any): CalendarBookingEvent | null {
  if (item?.status === 'cancelled') {
    return null;
  }

  if (item?.start?.date && item?.end?.date) {
    return {
      id: item.id || randomUUID(),
      summary: item.summary || '',
      description: item.description || '',
      startMs: new Date(`${item.start.date}T00:00:00+09:00`).getTime(),
      endMs: new Date(`${item.end.date}T00:00:00+09:00`).getTime(),
      allDay: true
    };
  }

  if (!item?.start?.dateTime || !item?.end?.dateTime) {
    return null;
  }

  return {
    id: item.id || randomUUID(),
    summary: item.summary || '',
    description: item.description || '',
    startMs: new Date(item.start.dateTime).getTime(),
    endMs: new Date(item.end.dateTime).getTime(),
    allDay: false
  };
}

export async function listCalendarEvents(timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime'
  });

  const data = await calendarRequest(`/events?${params.toString()}`, {
    method: 'GET'
  });

  return ((data?.items || []) as any[])
    .map(toCalendarBookingEvent)
    .filter(Boolean) as CalendarBookingEvent[];
}

export async function createCalendarEvent(input: {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}) {
  const data = await calendarRequest('/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startDateTime,
        timeZone: TOKYO_TIME_ZONE
      },
      end: {
        dateTime: input.endDateTime,
        timeZone: TOKYO_TIME_ZONE
      }
    })
  });

  return {
    id: data.id as string,
    htmlLink: data.htmlLink as string
  };
}
