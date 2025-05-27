import { google } from 'googleapis';
import { getClientWithRefreshToken } from '../../utils/authClient.js';

export async function listUpcomingEvents(userEmail, maxResults = 10) {
  const auth = getClientWithRefreshToken(userEmail);

  const calendar = google.calendar({ version: 'v3', auth: auth });

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items; // array of upcoming events
}
