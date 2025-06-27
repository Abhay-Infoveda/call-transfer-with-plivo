import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { appendToSheet } from '../tools/googleSheets/googleSheetTool.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Retrieve the OpenAI API key from environment variables
const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
    console.error('Missing OpenAI API key. Please set it in the .env file.');
}

// Constants
const SYSTEM_MESSAGE = `You are Steve, a warm, friendly Australian male voice assistant who helps users book hotels. Speak casually ("mate" not "machine") and greet users with, "Hey there! You're speaking with Steve. How can I help you today?" Gather missing booking details one at a time: city/area, dates/nights, budget, guests, and preferences—keep responses crisp, natural, and not too fast. Suggest 1–3 hotels with brief descriptions and prices, then ask if they'd like to proceed. If yes, collect their full name and phone number, confirming each before moving to the next. Spell the name back for confirmation. When asking for the phone number: Confirm if the number you have is correct: {{ $json.query.From }}. If not, ask them to provide the correct one. Ensure it's a valid 10-digit mobile number (or with country code, e.g., +61 for Australia). Read the number back for confirmation. Once you have the name and phone number, check these details in the database using the Check_Details tool. If you find matching details, confirm with the user. If the user confirms, you can proceed to book the hotel without asking for further details. After all details are confirmed, use the Book_Hotel tool to make the booking, and send a confirmation using the Send_SMS tool (or equivalent) to their phone. End warmly: "All set—your room's booked, mate, and I've just sent the confirmation to your mobile. Anything else I can help you with?" If not, hang up. Keep the tone natural, friendly, and ask only one clear question at a time.

You have access to the following tools:
- Save_Booking_Details: Use this to save booking details to Google Sheets when a reservation is confirmed. Call this tool after all booking details are collected and confirmed.
- Save_transcript: Use this to save the transcript of the call to Google Sheets after the conversation ends. Call this tool before ending the call.

Whenever you need to perform one of these actions, call the appropriate tool with the required information.`;

const VOICE = 'echo';

// List of Event Types to log to the console
const LOG_EVENT_TYPES = [
    'error',
    'response.content.done',
    'rate_limits.updated',
    'response.done',
    'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started',
    'session.created'
];

// Show AI response elapsed timing calculations
const SHOW_TIMING_MATH = false;

// --- TOOL DEFINITIONS ---
const TOOLS = [
  {
    type: "function",
    name: "Save_Booking_Details",
    description: "Save the booking details to Google Sheets",
    parameters: {
      type: "object",
      properties: {
        phone_number: { type: "string", description: "The caller's phone number" },
        restaurant: { type: "string", description: "Restaurant at which the table is booked" },
        guests: { type: "string", description: "Number of guests attending" },
        time: { type: "string", description: "Time at which the restaurant is booked" },
        date: { type: "string", description: "Date for which the restaurant is booked" },
        name: { type: "string", description: "Name of the guest making the booking" }
      },
      required: ["phone_number", "restaurant", "guests", "time", "date", "name"]
    }
  },
  {
    type: "function",
    name: "Save_transcript",
    description: "Save the transcript of a call to Google Sheets",
    parameters: {
      type: "object",
      properties: {
        callid: { type: "string", description: "The call ID" }
      },
      required: ["callid"]
    }
  }
  // Add more tools here as needed
];

// Route for Twilio to handle incoming calls
router.all('/incoming-call', async (req, res) => {
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
                          <Response>
                              <Say>Please wait while we connect your call to the A. I. voice assistant, powered by Twilio and the Open-A.I. Realtime API</Say>
                              <Pause length="1"/>
                              <Say>O.K. you can start talking!</Say>
                              <Connect>
                                  <Stream url="wss://${req.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;

    res.type('text/xml').send(twimlResponse);
});

// WebSocket server setup
let wss = null;

// Function to setup WebSocket server
export function setupWebSocketServer(server) {
    wss = new WebSocketServer({ server, path: '/media-stream' });

    wss.on('connection', (connection, req) => {
        console.log('Client connected');

        // Connection-specific state
        let streamSid = null;
        let latestMediaTimestamp = 0;
        let lastAssistantItem = null;
        let markQueue = [];
        let responseStartTimestampTwilio = null;

        const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1"
            }
        });

        // Control initial session with OpenAI
        const initializeSession = () => {
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    turn_detection: { type: 'server_vad' },
                    input_audio_format: 'g711_ulaw',
                    output_audio_format: 'g711_ulaw',
                    voice: VOICE,
                    instructions: SYSTEM_MESSAGE,
                    modalities: ["text", "audio"],
                    temperature: 0.8,
                    tools: TOOLS
                }
            };

            console.log('Sending session update:', JSON.stringify(sessionUpdate));
            openAiWs.send(JSON.stringify(sessionUpdate));
        };

        // Handle interruption when the caller's speech starts
        const handleSpeechStartedEvent = () => {
            if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
                const elapsedTime = latestMediaTimestamp - responseStartTimestampTwilio;
                if (SHOW_TIMING_MATH) console.log(`Calculating elapsed time for truncation: ${latestMediaTimestamp} - ${responseStartTimestampTwilio} = ${elapsedTime}ms`);

                if (lastAssistantItem) {
                    const truncateEvent = {
                        type: 'conversation.item.truncate',
                        item_id: lastAssistantItem,
                        content_index: 0,
                        audio_end_ms: elapsedTime
                    };
                    if (SHOW_TIMING_MATH) console.log('Sending truncation event:', JSON.stringify(truncateEvent));
                    openAiWs.send(JSON.stringify(truncateEvent));
                }

                connection.send(JSON.stringify({
                    event: 'clear',
                    streamSid: streamSid
                }));

                // Reset
                markQueue = [];
                lastAssistantItem = null;
                responseStartTimestampTwilio = null;
            }
        };

        // Send mark messages to Media Streams so we know if and when AI response playback is finished
        const sendMark = (connection, streamSid) => {
            if (streamSid) {
                const markEvent = {
                    event: 'mark',
                    streamSid: streamSid,
                    mark: { name: 'responsePart' }
                };
                connection.send(JSON.stringify(markEvent));
                markQueue.push('responsePart');
            }
        };

        // Open event for OpenAI WebSocket
        openAiWs.on('open', () => {
            console.log('Connected to the OpenAI Realtime API');
            setTimeout(initializeSession, 100);
        });

        // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
        openAiWs.on('message', async (data) => {
            try {
                const response = JSON.parse(data);

                // Handle tool calls
                if (response.type === 'tool_use' && response.tool_call) {
                    const { name, arguments: args, tool_call_id } = response.tool_call;
                    console.log(`[TOOL CALL] Agent requested tool: ${name} with arguments:`, args);
                    let result;
                    if (name === 'Save_Booking_Details') {
                        result = await appendToSheet(args);
                    } else if (name === 'Save_transcript') {
                        result = await saveTranscript(args.callid);
                    }
                    // Add more tool handlers as needed
                    openAiWs.send(JSON.stringify({
                        type: 'tool_result',
                        tool_call_id,
                        result
                    }));
                    return;
                }

                if (LOG_EVENT_TYPES.includes(response.type)) {
                    console.log(`Received event: ${response.type}`, response);
                }

                if (response.type === 'response.audio.delta' && response.delta) {
                    const audioDelta = {
                        event: 'media',
                        streamSid: streamSid,
                        media: { payload: response.delta }
                    };
                    connection.send(JSON.stringify(audioDelta));

                    // First delta from a new response starts the elapsed time counter
                    if (!responseStartTimestampTwilio) {
                        responseStartTimestampTwilio = latestMediaTimestamp;
                        if (SHOW_TIMING_MATH) console.log(`Setting start timestamp for new response: ${responseStartTimestampTwilio}ms`);
                    }

                    if (response.item_id) {
                        lastAssistantItem = response.item_id;
                    }
                    
                    sendMark(connection, streamSid);
                }

                if (response.type === 'input_audio_buffer.speech_started') {
                    handleSpeechStartedEvent();
                }
            } catch (error) {
                console.error('Error processing OpenAI message:', error, 'Raw message:', data);
            }
        });

        // Handle incoming messages from Twilio
        connection.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                switch (data.event) {
                    case 'media':
                        latestMediaTimestamp = data.media.timestamp;
                        if (SHOW_TIMING_MATH) console.log(`Received media message with timestamp: ${latestMediaTimestamp}ms`);
                        if (openAiWs.readyState === WebSocket.OPEN) {
                            const audioAppend = {
                                type: 'input_audio_buffer.append',
                                audio: data.media.payload
                            };
                            openAiWs.send(JSON.stringify(audioAppend));
                        }
                        break;
                    case 'start':
                        streamSid = data.start.streamSid;
                        console.log('Incoming stream has started', streamSid);

                        // Reset start and media timestamp on a new stream
                        responseStartTimestampTwilio = null; 
                        latestMediaTimestamp = 0;
                        break;
                    case 'mark':
                        if (markQueue.length > 0) {
                            markQueue.shift();
                        }
                        break;
                    default:
                        console.log('Received non-media event:', data.event);
                        break;
                }
            } catch (error) {
                console.error('Error parsing message:', error, 'Message:', message);
            }
        });

        // Handle connection close
        connection.on('close', () => {
            if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
            console.log('Client disconnected.');
        });

        // Handle WebSocket close and errors
        openAiWs.on('close', () => {
            console.log('Disconnected from the OpenAI Realtime API');
        });

        openAiWs.on('error', (error) => {
            console.error('Error in the OpenAI WebSocket:', error);
        });
    });
}

export default router; 