import { google } from 'googleapis';
import fs from 'fs';

export async function listUpcomingEvents(userEmail, maxResults = 10) {
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

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items; // array of upcoming events
}
