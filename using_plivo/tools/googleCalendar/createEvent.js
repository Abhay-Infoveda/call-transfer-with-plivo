import { google } from 'googleapis';
import fs from 'fs';

export async function createCalendarEvent(userEmail, eventDetails) {
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

  const event = {
    summary: eventDetails.summary,
    location: eventDetails.location,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: 'Asia/Kolkata',
    },
    attendees: eventDetails.attendees, // array of { email: "..." }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return response.data;
}
