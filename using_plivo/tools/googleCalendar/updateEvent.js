import { google } from 'googleapis';
import { getClientWithRefreshToken } from '../../utils/authClient.js';

export async function updateCalendarEvent(userEmail, eventId, updatedFields) {
  const auth = getClientWithRefreshToken(userEmail);
  const calendar = google.calendar({ version: 'v3', auth: auth });

  const updatedEvent = {
    ...(updatedFields.summary && { summary: updatedFields.summary }),
    ...(updatedFields.location && { location: updatedFields.location }),
    ...(updatedFields.description && { description: updatedFields.description }),
    ...(updatedFields.startDateTime && {
      start: { dateTime: updatedFields.startDateTime, timeZone: 'Asia/Kolkata' }
    }),
    ...(updatedFields.endDateTime && {
      end: { dateTime: updatedFields.endDateTime, timeZone: 'Asia/Kolkata' }
    }),
    ...(Array.isArray(updatedFields.attendees) && {
      attendees: updatedFields.attendees.map(email => ({ email }))
    })
  };

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updatedEvent,
  });

  return response.data;
}
