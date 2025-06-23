import { google } from 'googleapis';
import fs from 'fs';
import fetch from 'node-fetch';

// Fixed values for the transcript sheet
const userEmail = 'abhay.pancholi@infovedasolutions.com';
const spreadsheetId = '1BtH7-V9aCGz34_nnTpassz3gmHOKBvKdK9Zq98fGWCg';
const sheetName = 'call_rec';
const ultravoxApiKey = process.env.ULTRAVOX_API_KEY;

// Helper to get current datetime in ISO format
function getCurrentDatetime() {
  return new Date().toISOString();
}

// Fetch and stitch transcript, then save to Google Sheet
export async function saveTranscript(callid) {
  // 1. Fetch messages from Ultravox API
  const url = `https://api.ultravox.ai/api/calls/${callid}/messages`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-API-Key': ultravoxApiKey }
  });
  if (!response.ok) throw new Error('Failed to fetch call messages');
  const data = await response.json();

  // 2. Stitch transcript
  const transcript = (data.results || [])
    .map(msg => `${msg.role}: ${msg.text}`)
    .join('\n\n');

  // 3. Prepare values
  const current_datetime = getCurrentDatetime();
  const values = [current_datetime, callid, transcript];

  // 4. Save to Google Sheet
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