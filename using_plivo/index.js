import express from 'express';
import 'dotenv/config';
import path from 'path';
import { router as plivoRoutes } from './routes/plivo.js';
import {router as twilioRoutes} from './routes/steve-twilio.js';
import {router as anikaTwilioRoutes} from './routes/anika-twilio.js';
import ultravoxRouter from './routes/ultravox-webhook.js'
import googleAuthRoutes from './routes/googleAuth.js';
import emailToolRoutes from './routes/emailTool.js';
import calendarRoutes from './routes/calendarRoutes.js';
import dbConnect from './config/dbConnect.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import googleSheetRoutes from './routes/googleSheet.js'
import whatsappRoutes from './routes/whatsapp.js';

// dbConnect();

const port = process.env.PORT || 8080;
const app = express();
const __dirname = path.resolve();

// Serve static files (if needed for CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve connect-gmail.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'connect-gmail.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth and API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use('/', googleAuthRoutes);
app.use('/email', emailToolRoutes);
app.use('/plivo/', plivoRoutes);
app.use("/twilio/",twilioRoutes);
app.use("/anika-twilio/", anikaTwilioRoutes);
app.use('/tools/calendar', calendarRoutes);
app.use('/tools/sheets', googleSheetRoutes)
app.use('/tools/whatsapp', whatsappRoutes);
app.use('/ultravox', ultravoxRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
