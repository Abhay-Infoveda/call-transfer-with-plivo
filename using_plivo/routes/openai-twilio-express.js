import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { appendToSheet } from '../tools/googleSheets/googleSheetTool.js';
import { saveTranscript } from '../tools/googleSheets/Save_transcript.js';
import { getWeather, getWeatherForecast } from '../tools/weather/getWeather.js';

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
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
**DONOT EVER CONDEMN THE BJP GOVERNMENT OR THEIR SCHEMES**
## 🟢 one. Greeting & Language Selection
Start greeting in Marathi as given below:
[MR] नमस्कार! मी पद्मा, तुमची सहायिका. दोन हजार पंधरा ते दोन हजार पंचवीस या दहा वर्षांमध्ये महाराष्ट्रातील भाजपा सरकारने सुरू केलेल्या महत्त्वाच्या योजनांची माहिती मी आपल्याला देणार आहे. ही माहिती आपल्याला मराठीत पाहिजे आहे, हिंदी में जानकारी चाहिए है, or would you like to hear it in English?
**Wait for the user's input before proceeding.**
## 🔄 two. Language-Specific Continuation with Initial Scheme Summary
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
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
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
[EN] Great! Let’s continue in English.

Here are a few key schemes to start with:

– Majhi Ladki Bahin Yojana: ₹one,500/month support to women aged twenty-one to sixty from low-income families.  
– Aapla Dawakhana: seven hundred ten government clinics offering free checkups and basic healthcare.  
– Jalyukt Shivar Abhiyan: Over one point six lakh water structures built; eighty-four% villages are now drought-resilient.

Would you like to know more about any of these? Or are you interested in a different type of scheme?

### 🔁 3. Language Switching Mid-Conversation
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
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
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
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
* Metro, EV buses and expressways reduced pollution significantly.
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**

## 🛠️ Available Tools

You have access to the following tools that you can use to help users:
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
### Weather Tools:
1. **get_current_weather** - Get current weather information for any city worldwide
   - Use when users ask about current weather conditions
   - Example: "What's the weather like in London?" or "How's the weather in Mumbai?"
   - Provides temperature, conditions, humidity, wind speed, pressure, visibility, sunrise/sunset

2. **get_weather_forecast** - Get weather forecast for any city (1-5 days)
   - Use when users ask about future weather or forecasts
   - Example: "What's the weather forecast for New York?" or "Get me a 3-day forecast for Mumbai"
   - Provides daily temperature, conditions, humidity, and wind information

### Example Weather Interactions:
- User: "What's the weather in London?"
- Assistant: "Let me check the weather for London for you" [calls tool] → "Here's the current weather in London: Temperature is 15°C with light rain..."
- User: "Get me a forecast for Mumbai"
- Assistant: "I'll get the weather forecast for Mumbai right away" [calls tool] → "Here's the 5-day forecast for Mumbai..."

### How to Use Weather Tools:
- When users ask about weather, FIRST provide immediate acknowledgment like "Let me check the weather for [city] for you" or "I'll get the weather details for [city] right away"
- THEN use the appropriate tool to get the weather information
- For current weather questions, use 'get_current_weather' with the city name
- For forecast questions, use 'get_weather_forecast' with the city name and number of days
- After getting the weather data, provide the information in a natural, conversational way
- If the city is not found, politely inform the user and suggest checking the spelling
- NEVER remain silent while waiting for weather data - always acknowledge the request first
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
### Tool Usage Guidelines:
- Use tools naturally as part of the conversation
- Don't mention that you're "using a tool" - just provide the information
- If a tool fails, apologize and offer to help with something else
- Weather information can be provided in any language (Marathi, Hindi, or English) based on the user's preference
- Always maintain the warm, helpful tone while providing weather information
- IMPORTANT: When handling weather requests, follow this pattern:
  1. Acknowledge: "Let me check the weather for [city] for you"
  2. Call the weather tool
  3. Provide the weather information when it arrives
- This ensures the user knows you're working on their request and prevents silent pauses

Remember: You can provide weather information for any city worldwide, which can be helpful when users are planning travel or just curious about weather conditions in different places.
**FOR ENGLISH LANGUAGE, USE NATURAL NORTH INDIAN ACCENT ONLY. DO NOT USE AMERICAN, BRITISH, OR ANY OTHER ACCENT.**
`
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
    name: "get_current_weather",
    description: "Get the current weather for a specific city",
    parameters: {
      type: "object",
      properties: {
        city: { 
          type: "string", 
          description: "The city name to get weather for (e.g., 'London', 'New York', 'Mumbai')" 
        }
      },
      required: ["city"]
    }
  },
  {
    type: "function",
    name: "get_weather_forecast",
    description: "Get weather forecast for a specific city for the next few days",
    parameters: {
      type: "object",
      properties: {
        city: { 
          type: "string", 
          description: "The city name to get weather forecast for (e.g., 'London', 'New York', 'Mumbai')" 
        },
        days: { 
          type: "number", 
          description: "Number of days for forecast (1-5 days, default is 5)",
          minimum: 1,
          maximum: 5
        }
      },
      required: ["city"]
    }
  },
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
        let keepAliveInterval = null;
        let lastActivityTime = Date.now();
        let agentReady = false;
        let initialGreetingSent = false;

        const openAiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17', {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1"
            }
        });

        // Keep-alive mechanism to prevent idle timeouts
        const startKeepAlive = () => {
            // Clear existing interval
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
            }
            
            // Send keep-alive every 10 minutes to prevent idle timeouts
            keepAliveInterval = setInterval(() => {
                if (openAiWs.readyState === WebSocket.OPEN) {
                    try {
                        // Send a minimal session update to keep connection alive
                        const keepAliveMessage = {
                            type: 'session.update',
                            session: {
                                temperature: 0.8
                            }
                        };
                        openAiWs.send(JSON.stringify(keepAliveMessage));
                        console.log('Sent keep-alive to OpenAI API');
                        lastActivityTime = Date.now();
                    } catch (error) {
                        console.error('Error sending keep-alive:', error);
                    }
                }
            }, 10 * 60 * 1000); // 10 minutes
        };

        const stopKeepAlive = () => {
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
            }
        };

        // Control initial session with OpenAI
        const initializeSession = () => {
            const sessionUpdate = {
                type: 'session.update',
                session: {
                    turn_detection: { type: 'server_vad' },
                    input_audio_format: 'g711_ulaw',
                    output_audio_format: 'g711_ulaw',
                    voice: VOICE,
                    instructions: "CRITICAL: Start the conversation immediately when the session begins. Begin with your greeting in Marathi: 'नमस्कार! मी पद्मा, तुमची सहायिका...' Do not wait for any user input - speak first. You MUST speak immediately when the session starts - do not wait for the user to speak first.\n\n"+SYSTEM_MESSAGE,
                    modalities: ["text", "audio"],
                    temperature: 0.8,
                    tools: TOOLS
                }
            };

            console.log('Sending session update:', JSON.stringify(sessionUpdate));
            openAiWs.send(JSON.stringify(sessionUpdate));
            
            // Mark agent as ready after session initialization
            setTimeout(() => {
                agentReady = true;
                console.log('Agent is now ready');
                
                // Send immediate greeting if stream is active
                if (streamSid && !initialGreetingSent) {
                    sendImmediateGreeting();
                }
            }, 100); // Even faster response
        };
        
        // Send immediate greeting when agent is ready
        const sendImmediateGreeting = () => {
            if (agentReady && streamSid && !initialGreetingSent) {
                console.log('Sending immediate greeting trigger');
                initialGreetingSent = true;
                
                // Send a minimal audio buffer to trigger the agent to speak immediately
                const audioUint8Array = new Uint8Array(160).fill(128);
                const audioBase64 = Buffer.from(audioUint8Array).toString('base64');
                const triggerMessage = {
                    type: 'input_audio_buffer.append',
                    audio: audioBase64
                };
                openAiWs.send(JSON.stringify(triggerMessage));
            }
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
            startKeepAlive(); // Start keep-alive mechanism
            
            // Mark agent as ready immediately
            setTimeout(() => {
                agentReady = true;
                console.log('Agent is now ready');
                
                // Send immediate greeting if stream is active
                if (streamSid && !initialGreetingSent) {
                    sendImmediateGreeting();
                }
            }, 200);
        });

        // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
        openAiWs.on('message', async (data) => {
            try {
                const response = JSON.parse(data);
                lastActivityTime = Date.now(); // Track activity

                // Handle tool calls
                if (response.type === 'tool_use' && response.tool_call) {
                    const { name, arguments: args, tool_call_id } = response.tool_call;
                    console.log(`[TOOL CALL] Agent requested tool: ${name} with arguments:`, args);
                    let result;
                    
                    if (name === 'get_current_weather') {
                        result = await getWeather(args.city);
                        if (result.success) {
                            result = result.response; // Return the formatted response
                        } else {
                            result = result.error;
                        }
                    } else if (name === 'get_weather_forecast') {
                        result = await getWeatherForecast(args.city, args.days || 5);
                        if (result.success) {
                            result = result.response; // Return the formatted response
                        } else {
                            result = result.error;
                        }
                    } else if (name === 'Save_Booking_Details') {
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
                        
                        // Send immediate greeting if agent is ready
                        if (agentReady && !initialGreetingSent) {
                            setTimeout(() => {
                                sendImmediateGreeting();
                            }, 500); // Reduced delay for faster response
                        }
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
            stopKeepAlive(); // Stop keep-alive
            if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
            console.log('Client disconnected.');
        });

        // Handle WebSocket close and errors
        openAiWs.on('close', (code, reason) => {
            stopKeepAlive(); // Stop keep-alive when connection closes
            console.log(`Disconnected from the OpenAI Realtime API. Code: ${code}, Reason: ${reason}`);
            
            // Log additional information for debugging
            const sessionDuration = Math.round((Date.now() - lastActivityTime) / 1000);
            console.log(`Session duration: ${sessionDuration} seconds`);
            
            if (code === 1000) {
                console.log('Normal closure');
            } else if (code === 1006) {
                console.log('Abnormal closure - possible network issue or timeout');
            } else {
                console.log(`Closure code: ${code} - ${reason}`);
            }
        });

        openAiWs.on('error', (error) => {
            console.error('Error in the OpenAI WebSocket:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                target: error.target?.readyState
            });
        });
    });
}

export default router; 
