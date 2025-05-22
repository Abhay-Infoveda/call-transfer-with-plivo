import { google } from 'googleapis';
import fs from 'fs';

export async function deleteCalendarEvent(userEmail, eventId) {
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

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });

  return { success: true, message: `Event ${eventId} deleted.` };
}
