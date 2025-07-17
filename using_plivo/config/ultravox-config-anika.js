// ultravox-config.js
const toolsBaseUrl = process.env.TOOLS_BASE_URL; // Your publicly accessible URL

// Ultravox configuration
const SYSTEM_PROMPT = `
You are Anika, a polite and professional AI reservations assistant for WOS Restaurants. Speak in Indian English 
with a soft tone, avoiding slang or abbreviations. Greet guests warmly, introduce yourself as Anika, and ask for 
their name. Use "Save_Calls" function to add the call to the list as soon as a call connects (don't mention it to the customer). Assist only with reservations, asking for the restaurant name, date, arrival time, number of guests, 
guest’s name and email address—one detail at a time. When asking for the email, specifically request they 
**spell it out** one character or group at a time (e.g., “m – a – t – t … at … g – m – a – i – l … dot … com”), 
converting phrases like “at” and “at the rate” to "@" and “dot” to "." to construct a proper email format 
(e.g., "matt@gmail.com"). Confirm the final email by reading it aloud, speak slowly and ask for confirmation, if 
the user confirms then move on to phone number. The domain names can be '.co', '.com', or any user-specified. Use 
only the guest’s first name when addressing them, and mention their name no more than two to three times during 
the conversation to keep the interaction natural. Use the question_and_answer function to provide information on 
restaurant locations, facilities, and booking policies. Confirm reservations using "Create_Event" tool and send the confirmation email using "Send_Email" tool, and before 
ending the call, ask if the guest needs any further assistance. Always allow the guest to finish speaking without 
interrupting. Gently steer the conversation back to the reservation if it goes off-topic. Only if a customer asks to speak 
with a human agent, transfer the call and end it once the handover is complete. Also, before ending the call, use "Save_transcript" 
function to save the transcript of a call and "Save_details" tool to save the details.
WOS Restaurants includes: Laidback Café at GK-1 N Block, GK-2 M Block, Sangam Courtyard RK Puram, DLF Avenue Saaaket, Vegas Mall Dwaarka, DLF Cyber 
Hub Gurgaao, M3M IFC Gurgaao; In The Punjab at GK-2 M Block, Sangam Courtyard RK Puram, M3M IFC Gurgaao, Ambience 
Mall Gurgaao; and Shalom Café at Select CityWalk Saaaket, Ambience Mall Gurgaao.
`;

const Dental_Appoint_PROMPT = `

# Emily - Smiles & Shine Dental Clinics Virtual Assistant Prompt

You are **Emily**, a polite and professional AI assistant for **Smiles & Shine Dental Clinics**.  
Speak in **British English** with a **soft, clear tone**, avoiding slang or abbreviations.  
Always **speak slowly and clearly**, pausing as needed.  
**Never interrupt** — always allow the patient to finish speaking before you respond.
**Do not say the word **Pause** during a conversation even if user asks any information outside the scope. Or if you have to get information from any tool.**
Keep the conversation **short and concise** and always on track.

---

## 👋 Greeting & Introduction

1. Greet the patient warmly.  
2. Introduce yourself as 'Emily'.  
3. Ask for the patient’s **name**.  
4. Ask **which city they are speaking from**.  
   - ❗️Do not list all clinic locations unless the user asks or seems unsure.  
   - Only mention the relevant clinic(s) based on their city.

---

## 📋 Appointment Booking Flow

Collect one detail at a time, in this order:

1. Clinic location (based on city provided)  
2. Preferred date  
3. Preferred time slot  
4. Type of service  
   - (e.g., consultation, cleaning, braces, root canal, etc.)  
5. Patient’s **full name**  
6. **Mobile number**
`;

const STEVE_SYS_PROMPT = `You are Steve, a warm, friendly Australian male voice assistant who helps users book hotels. Speak casually (“mate” not “machine”) and greet users with, “Hey there! You’re speaking with Steve. How can I help you today?” Gather missing booking details one at a time: city/area, dates/nights, budget, guests, and preferences, keeping responses concise, crisp, and not too fast. Suggest 1–3 hotels with brief descriptions and prices, then ask if they’d like to proceed. If yes, collect full name, email, and phone number, confirming each one before moving to the next. Spell the name back for confirmation. For the email, have them spell it out character by character; recognize “at” or “at the rate” as @ and “dot” as ., then reconstruct, when user tells name read it aloud, and confirm also check it in the database using Check_Details tool if you find the correct details you can confirm it with the user and if the user confirms it you can use those details to book the hotel and send the confirmation email using 'Send_Email' tool and don't need to ask for further details. If you need the user's phone number it is right here: {{ $json.query.From }}. Only after all details are confirmed, use 'Book_Hotel' tool to book hotel and 'Send_Email' tool to send confirmation email to the customer, ensuring correct email format. End warmly (“All set—your room’s booked and I’ve just sent the confirmation to matt@gmail.com. Anything else I can help you with?”). If not, hang up. Keep tone natural, avoid robotic phrasing, and ask only one clear question at a time.`;

const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "Save_Booking_Details",
      "description": "Save the booking details to Google Sheets",
      "dynamicParameters": [
        {
          "name": "phone_number",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The caller's phone number",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "restaurant",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Restaurant at which the table is booked",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "guests",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Number of guests attending",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "time",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Time at which the restaurant is booked",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "date",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Date for which the restaurant is booked",
            "type": "string"
          },
          "required": true
        },
        {
          "name": "name",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Name of the guest making the booking",
            "type": "string"
          },
          "required": true
        }
      ],
      "http": {
      "baseUrlPattern": `${toolsBaseUrl}/tools/sheets/append`,
      "httpMethod": "POST"},
    }
  },
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
            "description": "The caller's first name.",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "lastName",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The caller's last name.",
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
        "baseUrlPattern": `${toolsBaseUrl}/anika-twilio/transferCall`,
        "httpMethod": "POST",
      },
    },
  },

  {
    "temporaryTool": {
      "modelToolName": "Send_Email",
      "description": "Sends email to a client detailing the confirmation of booking of a hotel or restaurant",
      "staticParameters":[
        {
          "name": "userEmail",
          "location": "PARAMETER_LOCATION_BODY",
          "value": "abhay.pancholi@infovedasolutions.com"
        }
      ],
      "dynamicParameters": [
        {
          "name": "to",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "email address of the client that they will tell.",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "subject",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Subject of the email",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "text",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Details about the booking like name, date, hotel name, no of persons, etc.",
            "type": "string",
          },
          "required": true,
        },
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/email/send`,
        "httpMethod": "POST",
      },
    },
  },
  {
    "temporaryTool": {
      "modelToolName": "Create_Event",
      "description": "Sends email to a client detailing the confirmation of booking of a hotel or restaurant",
      "staticParameters":[
        {
          "name": "userEmail",
          "location": "PARAMETER_LOCATION_BODY",
          "value": "abhay.pancholi@infovedasolutions.com"
        }
      ],
      "dynamicParameters": [
        {
          "name": "summary",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "This is the summary of the event.",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "startDateTime",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "This is the start time of the event in this format: 'YYYY-DD-MMTHH:MM:SS+05:30', for example: '2025-05-23T10:00:00+05:30'.",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "endDateTime",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "This is the end-date-time of the event in this format: 'YYYY-DD-MMTHH:MM:SS+05:30', for example: '2025-05-23T10:00:00+05:30'. If this is not explicitly described then consider it one hour after the startDateTime.",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "attendees",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Number of people attending the events, names if given",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "location",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Place at which the event is organized",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "description",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Description obout the event in detail.",
            "type": "string",
          },
          "required": true,
        },
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/tools/calendar/create_event`,
        "httpMethod": "POST",
      },
    },
  },
  {
    "temporaryTool": {
      "modelToolName": "Book_Restaurant",
      "description": "Books the restaurant for the user by sending the user provided data to the google sheet.",
      "staticParameters":[
        {
          "name": "userEmail",
          "location": "PARAMETER_LOCATION_BODY",
          "value": "abhay.pancholi@infovedasolutions.com"
        },
        {
          "name":"spreadsheetId",
          "location":"PARAMETER_LOCATION_BODY",
          "value":"1tNMwONsEjskVONDDAyrOyf9wBsUgI2mxfM2QK_jvTkk"
        },
        {
          "name":"sheetName",
          "location":"PARAMETER_LOCATION_BODY",
          "value":"Hotel_Bookings_Plivo"
        }
      ],
      "dynamicParameters": [
        {
          "name": "values",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "An array of values to insert into the sheet, the array will contain values as follows: phone_number, restaurant, guests, time, date and name",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "subject",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Subject of the email",
            "type": "string",
          },
          "required": true,
        },
        {
          "name": "text",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "Details about the booking like name, date, hotel name, no of persons, etc.",
            "type": "string",
          },
          "required": true,
        },
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/tools/sheets/append`,
        "httpMethod": "POST",
      },
    },
  },

  {
  "temporaryTool": {
    "modelToolName": "Send_WhatsApp_Appointment_Confirmation",
    "description": "Sends an appointment confirmation message to the user on whatsapp.",
    "dynamicParameters": [
      {
        "name": "to",
        "location": "PARAMETER_LOCATION_BODY",
        "schema": {
          "type": "string",
          "description": "Recipient's phone number in international format, e.g., 918459247685."
        },
        "required": true
      },
      {
        "name": "customer_name",
        "location": "PARAMETER_LOCATION_BODY",
        "schema": {
          "type": "string",
          "description": "Customer's name, e.g., Abhay Pancholi."
        },
        "required": true
      },
      {
        "name": "date_and_time",
        "location": "PARAMETER_LOCATION_BODY",
        "schema": {
          "type": "string",
          "description": "Appointment date and time, e.g., '20 June at 7:30 PM'."
        },
        "required": true
      }
    ],
    "http": {
      "baseUrlPattern": `${toolsBaseUrl}/tools/whatsapp/send-template`,
      "httpMethod": "POST"
    }
  }
}


];

export const ULTRAVOX_CALL_CONFIG = {
  systemPrompt: Dental_Appoint_PROMPT,
  model: 'fixie-ai/ultravox',
  voice: 'Tanya-English', // Steve-English-Australian, Anika-English-Indian
  temperature: 0.3,
  firstSpeaker: 'FIRST_SPEAKER_AGENT',
  selectedTools: selectedTools,
  medium: { "twilio": {} } 
};


