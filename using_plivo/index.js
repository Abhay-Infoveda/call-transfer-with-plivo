import express from 'express';
import 'dotenv/config';
import path from 'path';
import { router as plivoRoutes } from './routes/plivo.js';
import {router as twilioRoutes} from './routes/steve-twilio.js';
import {router as anikaTwilioRoutes} from './routes/anika-twilio.js';
import ultravoxRouter from './routes/ultravox-webhook.js'
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import dbConnect from './config/dbConnect.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import googleSheetRoutes from './routes/googleSheet.js'
import whatsappRoutes from './routes/whatsapp.js';
import cors from 'cors'; // Import the cors package
import toolRoutes from './routes/toolRoutes.js'; // Import tool routes
import agentRoutes from './routes/agentRoutes.js'; // Import agent routes
import { router as twilioOutboundRouter } from './routes/twilioOutbound.js';
import projectRoutes from './routes/projectRoutes.js';
import projectAgentRoutes from './routes/projectAgentRoutes.js';
import openaiTwilioExpressRouter, { setupWebSocketServer } from './routes/openai-twilio-express.js';
import http from 'http';

dbConnect();

const port = process.env.PORT || 8080;
const app = express();
const __dirname = path.resolve();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only your frontend to connect
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

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
app.use('/api/tools', toolRoutes); // Use tool routes
app.use('/api/agents', agentRoutes); // Use agent routes
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/email', emailRoutes);
app.use('/plivo/', plivoRoutes);
app.use("/twilio/",twilioRoutes);
app.use("/anika-twilio/", anikaTwilioRoutes);
app.use('/tools/calendar', calendarRoutes);
app.use('/tools/sheets', googleSheetRoutes)
app.use('/tools/whatsapp', whatsappRoutes);
app.use('/ultravox', ultravoxRouter);
app.use('/twilio-outbound', twilioOutboundRouter);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectAgentRoutes);
app.use('/openai-twilio-express', openaiTwilioExpressRouter);

// Register the HTTP routes
// app.use('/openai-twilio-express', openaiTwilioExpressRouter);

// Create the HTTP server
const server = http.createServer(app);

// Setup the WebSocket server for /media-stream
setupWebSocketServer(server);

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
