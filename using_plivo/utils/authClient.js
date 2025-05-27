// utils/authClient.js
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { getToken } from './tokenStore.js';

dotenv.config();

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
}

export function getClientWithRefreshToken(userEmail) {
  const token = getToken(userEmail);
  if (!token || !token.refresh_token) {
    throw new Error(`No refresh token found for ${userEmail}`);
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: token.refresh_token });
  return oAuth2Client;
}
