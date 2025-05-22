// ultravox-config.js
const toolsBaseUrl = process.env.TOOLS_BASE_URL; // Your publicly accessible URL

// Ultravox configuration
const SYSTEM_PROMPT = `
Your name is Steve. You are a receptionist at Acme HVAC. Your job is as follows:
1. Answer all calls with a friendly, conversational approach.
2. Provide helpful answers to customer inquiries. You MUST use the "knowledgeLookup" tool for any product information requests. Do not make answers up!
3. If a customer wants to set-up a free consultation appointment, use the "checkAvailability" tool. You must get their name and phone number to finalize booking. Call the "transferCall" tool to hand the caller off to a live human agent who will finalize the booking.
4. If there are questions that you cannot answer or if the user becomes upset, you can use the "transferCall" tool to hand-off the call to a human support agent.
You should ask the caller if they want to book an appointment. If they do, use the "checkAvailability" tool and then tell the caller two options.
`;

const selectedTools = [
  
  {
    "temporaryTool": {
      "modelToolName": "transferCall",
      "description": "Transfers call to a human. Use this to finalize booking an appointment or if there are questions you cannot answer.",
      "automaticParameters": [
        {
          "name": "callId",
          "location": "PARAMETER_LOCATION_BODY",
          "knownValue": "KNOWN_PARAM_CALL_ID"
        }
      ],
      "dynamicParameters": [
        {
          "name": "firstName",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The caller's first name",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "lastName",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The caller's last name",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "phoneNumber",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The caller's phone number",
            "type": "string",
          },
          "required": true,
        },
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/twilio/transferCall`,
        "httpMethod": "POST",
      },
    },
  },
];

export const ULTRAVOX_CALL_CONFIG = {
  systemPrompt: SYSTEM_PROMPT,
  model: 'fixie-ai/ultravox',
  voice: 'Mark',
  temperature: 0.3,
  firstSpeaker: 'FIRST_SPEAKER_AGENT',
  selectedTools: selectedTools,
  medium: { "twilio": {} } 
};