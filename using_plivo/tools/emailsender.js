//THIS IS FOR TESTING LOCALLY

// import nodemailer from 'nodemailer'
// import {google} from 'googleapis'

// // These id's and secrets should come from .env file.
// const CLIENT_ID = '483216549511-iorstmcdptb2dds0fbtrtel4g8tdb3m6.apps.googleusercontent.com';
// const CLEINT_SECRET = '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';
// const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
// const REFRESH_TOKEN = '1//04ACR3ZVAuCJWCgYIARAAGAQSNwF-L9IrhAehQVtIH4uT7D8jYExC05Fj-j9BI47us8itM8vcxtnjTwMF_flEHz7IBqblNFRLPnk';

// const oAuth2Client = new google.auth.OAuth2(
//   CLIENT_ID,
//   CLEINT_SECRET,
//   REDIRECT_URI
// );
// oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// async function sendMail() {
//   try {
//     const accessToken = await oAuth2Client.getAccessToken();

//     const transport = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: 'abhay.pancholi@infovedasolutions.com',
//         clientId: CLIENT_ID,
//         clientSecret: CLEINT_SECRET,
//         refreshToken: REFRESH_TOKEN,
//         accessToken: accessToken,
//       },
//     });

//     const mailOptions = {
//       from: 'Abhay Pancholi Infoveda <abhay.pancholi@infovedasolutions.com>',
//       to: 'abhaynagendrapancholi@gmail.com',
//       subject: 'Hello from gmail using API',
//       text: 'Hello from gmail email using API',
//       html: '<h1>Hello from gmail email using API</h1>',
//     };

//     const result = await transport.sendMail(mailOptions);
//     return result;
//   } catch (error) {
//     return error;
//   }
// }

// sendMail()
//   .then((result) => console.log('Email sent...', result))
//   .catch((error) => console.log(error.message));







//THIS IS FOR TESTING WITH THE AI AGENT
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import fs from 'fs';

export async function sendEmail(userEmail, to, subject, text) {
  const tokenDB = JSON.parse(fs.readFileSync('./userTokensDB.json', 'utf8'));
  const user = tokenDB[userEmail];
  if (!user || !user.refresh_token) throw new Error('User not authenticated or token missing.');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: user.refresh_token });

  const accessTokenObj = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenObj?.token;

  if (!accessToken) throw new Error('Failed to retrieve access token');

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: userEmail,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: user.refresh_token,
      accessToken: accessToken
    }
  });

  const mailOptions = {
    from: userEmail,
    to,
    subject,
    text,
    html: `<p>${text}</p>`
  };

  const result = await transport.sendMail(mailOptions);
  return result;
}

