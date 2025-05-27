import { google } from 'googleapis';
import { getClientWithRefreshToken } from '../../utils/authClient.js';
export async function createCalendarEvent(userEmail, eventDetails) {
  
  const auth = getClientWithRefreshToken(userEmail);
  const calendar = google.calendar({ version: 'v3', auth: auth });
  
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
