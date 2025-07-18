import { google } from 'googleapis';
import fs from 'fs';

// Fixed values
const userEmail = 'abhay.pancholi@infovedasolutions.com';
const spreadsheetId = '1tNMwONsEjskVONDDAyrOyf9wBsUgI2mxfM2QK_jvTkk';
const sheetName = 'bookings';

// Accepts a single JSON object with booking values
export async function appendToSheet(bookingData) {
  const tokenDB = JSON.parse(fs.readFileSync('./userTokensDB.json', 'utf8'));
  const user = tokenDB[userEmail];
  if (!user) throw new Error('User not authenticated.');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: user.refresh_token });

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Map bookingData to the correct order: phone_number, restaurant, guests, time, date, name
  const values = [
    bookingData.phone_number || '',
    bookingData.restaurant || '',
    bookingData.guests || '',
    bookingData.time || '',
    bookingData.date || '',
    bookingData.name || ''
  ];

  console.log('Appending to range:', sheetName);
  console.log('Values:', values);

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values]
    }
  });

  return result.data;
}
