import { google } from 'googleapis';
import fs from 'fs';

export async function updateCalendarEvent(userEmail, eventId, updatedFields) {
  const tokenDB = JSON.parse(fs.readFileSync('./userTokensDB.json', 'utf8'));
  const user = tokenDB[userEmail];
  if (!user) throw new Error('User not authenticated.');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: user.refresh_token });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

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
