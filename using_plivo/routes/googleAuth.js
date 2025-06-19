// routes/googleAuth.js
import express from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { saveToken } from '../utils/tokenStore.js';

dotenv.config();

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 🔗 Step 1: Start OAuth2 flow
router.get('/auth/google', (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/spreadsheets'
            ],
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// 🔁 Step 2: OAuth2 callback
router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    const email = data.email;

    saveToken(email, { refresh_token: tokens.refresh_token });

    res.send(`<h3>Email connected: ${email}</h3>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Auth Failed');
  }
});

export default router;
