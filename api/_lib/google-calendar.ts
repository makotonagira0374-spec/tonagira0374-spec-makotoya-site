import { createSign, randomUUID } from 'node:crypto';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar';
const TOKYO_TIME_ZONE = 'Asia/Tokyo';

export type CalendarBookingEvent = {
  id: string;
  summary: string;
  description: string;
  startMs: number;
  endMs: number;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

async function getGoogleAccessToken() {
  const clientEmail = getRequiredEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('GOOGLE_PRIVATE_KEY'));
  const issuedAt = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_ENDPOINT,
    exp: issuedAt + 3600,
    iat: issuedAt
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(privateKey);
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google token request failed: ${details || response.status}`);
  }

  const data = await response.json();
  return data.access_token as string;
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
  if (!item?.start?.dateTime || !item?.end?.dateTime || item.status === 'cancelled') {
    return null;
  }

  return {
    id: item.id || randomUUID(),
    summary: item.summary || '',
    description: item.description || '',
    startMs: new Date(item.start.dateTime).getTime(),
    endMs: new Date(item.end.dateTime).getTime()
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
