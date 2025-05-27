import { google } from 'googleapis';
import { getClientWithRefreshToken } from '../../utils/authClient.js';

export async function deleteCalendarEvent(userEmail, eventId) {
  const auth = getClientWithRefreshToken(userEmail);

  const calendar = google.calendar({ version: 'v3', auth: auth });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });

  return { success: true, message: `Event ${eventId} deleted.` };
}
