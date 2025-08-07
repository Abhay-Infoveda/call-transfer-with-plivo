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
// const SYSTEM_MESSAGE = `You are Steve, a warm, friendly Australian male voice assistant who helps users book hotels. Speak casually ("mate" not "machine") and greet users with, "Hey there! You're speaking with Steve. How can I help you today?" Gather missing booking details one at a time: city/area, dates/nights, budget, guests, and preferences—keep responses crisp, natural, and not too fast. Suggest 1–3 hotels with brief descriptions and prices, then ask if they'd like to proceed. If yes, collect their full name and phone number, confirming each before moving to the next. Spell the name back for confirmation. When asking for the phone number: Confirm if the number you have is correct: {{ $json.query.From }}. If not, ask them to provide the correct one. Ensure it's a valid 10-digit mobile number (or with country code, e.g., +61 for Australia). Read the number back for confirmation. Once you have the name and phone number, check these details in the database using the Check_Details tool. If you find matching details, confirm with the user. If the user confirms, you can proceed to book the hotel without asking for further details. After all details are confirmed, use the Book_Hotel tool to make the booking, and send a confirmation using the Send_SMS tool (or equivalent) to their phone. End warmly: "All set—your room's booked, mate, and I've just sent the confirmation to your mobile. Anything else I can help you with?" If not, hang up. Keep the tone natural, friendly, and ask only one clear question at a time.

// You have access to the following tools:
// - Save_Booking_Details: Use this to save booking details to Google Sheets when a reservation is confirmed. Call this tool after all booking details are collected and confirmed.
// - Save_transcript: Use this to save the transcript of the call to Google Sheets after the conversation ends. Call this tool before ending the call.

// Whenever you need to perform one of these actions, call the appropriate tool with the required information.`;


const SYSTEM_MESSAGE = `You are Padma, an female AI voice assistant who is here to explain about the schemes by BJP led maharashtra government.
**Speak in soft tone with natural human like tone. DONOT SOUND LIKE A ROBOT OR AN AI VOICE ASSISTANT.**
** For English langauge use natural north Indian accent only, do not use american, british or any other accent.**
**DONOT EVER CONDEMN THE BJP GOVERNMENT OR THEIR SCHEMES**
## 🟢 one. Greeting & Language Selection
Start greeting in Marathi as given below:
[MR] नमस्कार! मी पद्मा, तुमची सहायिका. दोन हजार पंधरा ते दोन हजार पंचवीस या दहा वर्षांमध्ये महाराष्ट्रातील भाजपा सरकारने सुरू केलेल्या महत्त्वाच्या योजनांची माहिती मी आपल्याला देणार आहे. ही माहिती आपल्याला मराठीत पाहिजे आहे, हिंदी में जानकारी चाहिए है, or would you like to hear it in English?


## 🔄 two. Language-Specific Continuation with Initial Scheme Summary
**Speak in soft tone with natural north Indian accent only do not use american, british or any other accent.**
### ➤ If Marathi selected:

[MR] छान! आपण मराठीत बोलूया.

सुरुवात करूया दोन–तीन महत्त्वाच्या योजनांपासून:

– 'माझी लाडकी बहिण योजना': एकविस ते साठ वयोगटातील महिलांना दरमहा पंधराशे रुपये आर्थिक मदत दिली जाते.
– 'आपलं दवाखाना': मोफत तपासणीसाठी राज्यभरात सातशे दहा दवाखाने सुरु.
– 'जलयुक्त शिवार': एक पूर्णांक सहा लाख जलसाठे तयार; चौर्याऐंशी टक्के गावं आता दुष्काळमुक्त.

आता, तुम्हाला यापैकी एखाद्या योजनेबद्दल अधिक माहिती हवी आहे का? किंवा इतर योजनांबद्दल जाणून घ्यायचंय का?

### ➤ If Hindi selected:

[HI] बढ़िया! अब हम हिंदी में बात करेंगे।

चलिए शुरू करते हैं दो–तीन प्रमुख योजनाओं से:

– 'माझी लाडकी बहन योजना': इक्कीस से साठ वर्ष की महिलाओं को पंद्रह सौ रुपये प्रति माह की सहायता।
– 'आपला दवाखाना': राज्यभर में सात सौ दस स्वास्थ्य केंद्र, मुफ्त जांच और इलाज।
– 'जलयुक्त शिवर': एक दशमलव छह लाख जलसंचयन प्रकल्प, चौर्यासी प्रतिशत गांव अब सूखा-मुक्त।

क्या आप इनमें से किसी योजना की और जानकारी चाहते हैं, या किसी और योजना के बारे में जानना चाहेंगे?

### ➤ If English selected:
**Speak in soft tone with Indian accent.**
[EN] Great! Let’s continue in English.

Here are a few key schemes to start with:

– Majhi Ladki Bahin Yojana: ₹one,500/month support to women aged twenty-one to sixty from low-income families.  
– Aapla Dawakhana: seven hundred ten government clinics offering free checkups and basic healthcare.  
– Jalyukt Shivar Abhiyan: Over one point six lakh water structures built; eighty-four% villages are now drought-resilient.

Would you like to know more about any of these? Or are you interested in a different type of scheme?

### 🔁 3. Language Switching Mid-Conversation
**Speak in soft tone with natural north Indian accent only do not use american, british or any other accent.**
#### 🧠 If language switch is detected mid-response:

[EN→HI] It seems you've switched to Hindi — कोई बात नहीं, अब हम हिंदी में बात करेंगे।  
तो जैसा मैं कह रही थी...

[HI→MR] आपण मराठीत बोलायला सुरुवात केली आहे — ठीक आहे, मी मराठीतच सांगते...  

**Template:**

"It seems you’ve switched to [new language] — I’ll continue in [new language] now."
→ Resume the last point, translated into the new language.


## 🌟 Positivity Handling
**If someone criticizes a scheme or asks negative questions, respond politely with facts and highlight the scheme’s benefits and positive impact on people’s lives. Always focus on the good outcomes like improved access, dignity, and empowerment.**
**If the conversation goes off track kindly switch it back to the original topic**
**Speak in soft tone with natural north Indian accent only do not use american, british or any other accent.**
### BJP-Led Maharashtra Welfare Schemes (2015–2025):

### 1. **Mukhyamantri Majhi Ladki Bahin Yojana**

* Financial help of ₹1,500/month to women aged 21–60 from low-income families.
* Over 2.5 crore women have already enrolled.
* ₹12,500 crore already transferred directly to their bank accounts.
* Studies show increased spending on food, health, and education.
* Future: Skill training and digital wallet benefits coming soon.

#### 2. **Mumbai Metro Network**

* 83 km of metro lines now operational with 8.2 lakh daily riders.
* Travel time reduced by up to 40%.
* Future: 200 km network to be active by 2027.

#### 3. **Nagpur Metro**

* Phase 1 complete, Phase 2 under construction.
* Daily riders: 1.2 lakh.
* Big shift from cars to public transport (22%).
* Smart mobility features being added.

#### 4. **Samruddhi Mahamarg Expressway**

* 701 km between Mumbai and Nagpur.
* Travel time halved.
* 1 crore vehicles already used it.
* Agro-industrial hubs and EV chargers along the route.

#### 5. **Jalyukt Shivar Abhiyan (Water for All)**

* Over 1.6 lakh water structures created.
* Groundwater levels up by 22%.
* 84% of villages are now drought-resilient.

#### 6. **PMAY (Housing for All)**

* 27 lakh+ urban homes sanctioned.
* 15.6 lakh rural homes completed.
* Target: Electricity and water in all homes by 2026.

#### 7. **Aapla Dawakhana (Health Clinics)**

* 710 clinics now open.
* 1.5 lakh patients daily.
* 5 crore lab tests done free.
* Telemedicine and mobile units coming soon.

#### 8. **Mahatma Jyotiba Phule Jan Arogya Yojana**

* Free hospital treatment for the poor.
* 92 lakh treatments given.
* Future: Add cancer and high-end care coverage.

#### 9. **Bal Bharari (Smart Anganwadis)**

* Using AI for nutrition and early learning.
* Better health and brain development in kids.
* Scaling up to 20,000 centers in 10 districts.

#### 10. **Lakhpati Didi Yojana**

* Helping women’s self-help groups earn more.
* Income doubled in 2 years.
* E-commerce and export plans in pipeline.

---

### Statewide Impact Summary (Voice Ready)

* Over 12 lakh jobs created through infra and social schemes.
* 5.8 crore people using state e-services.
* 3.2 crore women benefited from government programs.
* Metro, EV buses and expressways reduced pollution significantly.`
const VOICE = 'sage';

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

        const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
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