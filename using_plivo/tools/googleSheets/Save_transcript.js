import { google } from 'googleapis';
import fs from 'fs';

// Fixed values for the transcript sheet
const userEmail = 'abhay.pancholi@infovedasolutions.com';
const spreadsheetId = '1BtH7-V9aCGz34_nnTpassz3gmHOKBvKdK9Zq98fGWCg';
const sheetName = 'call_rec';

export async function saveTranscript(values) {
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

  console.log('Appending transcript to range:', sheetName);
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