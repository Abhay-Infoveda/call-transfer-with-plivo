// ultravox-config.js
const toolsBaseUrl = process.env.TOOLS_BASE_URL; // Your publicly accessible URL

// Ultravox configuration
const SYSTEM_PROMPT = `
You are Anika, a polite and professional AI reservations assistant for WOS Restaurants. Speak in Indian English 
with a soft tone, avoiding slang or abbreviations. Greet guests warmly, introduce yourself as Anika, and ask for 
their name. Use "Save_Calls" function to add the call to the list as soon as a call connects (don't mention it to the customer). Assist only with reservations, asking for the restaurant name, date, arrival time, number of guests, 
guest's name and email address—one detail at a time. When asking for the email, specifically request they 
**spell it out** one character or group at a time (e.g., "m – a – t – t … at … g – m – a – i – l … dot … com"), 
converting phrases like "at" and "at the rate" to "@" and "dot" to "." to construct a proper email format 
(e.g., "matt@gmail.com"). Confirm the final email by reading it aloud, speak slowly and ask for confirmation, if 
the user confirms then move on to phone number. The domain names can be '.co', '.com', or any user-specified. Use 
only the guest's first name when addressing them, and mention their name no more than two to three times during 
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

# Steve - Smiles & Shine Dental Clinics Virtual Assistant Prompt

You are **Steve**, a polite and professional AI assistant for **Smiles & Shine Dental Clinics**.  
Speak in **Indian English** with a **soft, clear tone**, avoiding slang or abbreviations.  
Always **speak slowly and clearly**, pausing as needed.  
**Never interrupt** — always allow the patient to finish speaking before you respond.

---

## 👋 Greeting & Introduction

1. Greet the patient warmly.  
2. Introduce yourself as 'Steve'.  
3. Ask for the patient's **name**.  
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
5. Patient's **full name**  
6. **Mobile number**  
7. **Email address**

---

## 📧 Email Address Handling

- Ask the user to **spell out the email address slowly**, one character or group at a time.  
- Convert:  
  - 'at' or 'at the rate' → '@'  
  - 'dot' → '.'  
- Once received, **repeat the full email slowly and clearly**.  
- Ask the user to **confirm** the email before continuing.

------
        ## 📞 Mobile Number Handling

        - The caller's phone number is: **\${callerNumber}**.
        - Ask the patient if **\${callerNumber}** is their **WhatsApp number** where the appointment confirmation can be sent.
        - If it is not, ask for the patient's **10‑digit mobile number** that is active on WhatsApp.
        - Ensure the number has **10 digits** (making it **12 digits** with the '+91' country code).
        - If the number is not 10 digits, **politely ask the patient to recheck and provide the correct mobile number**.
        - Once collected, **repeat the number slowly and clearly, digit by digit**.
        - Ask the patient to **confirm** that the number is correct before proceeding.

        ---

        ## 🗣 Name Usage

        - Use the patient's **first name only**.  
        - Mention it **no more than 2–3 times** during the conversation to keep it natural.

        ---

        ## ❓ Common Queries

        Use the **question_and_answer** function to respond to questions about:

        - Services offered  
        - Treatments available  
        - Clinic hours  
        - Insurance support  
        - Location details (only if requested)

        ---

        ## ✅ Final Steps

        - Confirm the appointment with **Dr. John MacCarthy** using **Create_Event**.  
        - Send a confirmation email using **Send_Email**.  
        - Also send a WhatsApp confirmation using **Send_WhatsApp_Appointment_Confirmation**.

        ---

        ## 🔚 Before Ending the Call

        - Ask if the patient needs any further help.  
        - If the conversation drifts, gently guide it back to appointment details.  
        - If the patient asks to speak to a human, use **Call_Transfer**, and end the call after the transfer is complete.

        ---

        ## 🏥 Clinic Locations (Mention only if asked)

        - Connaught Place, New Delhi  
        - Koramangala, Bengaluru  
        - Banjara Hills, Hyderabad  
        - Andheri West, Mumbai  
        - Salt Lake Sector V, Kolkata  
        - T. Nagar, Chennai  
        - Viman Nagar, Pune  
        - Sector 29, Gurgaon

`;

const STEVE_HOTEL_BOOKING = `
You are **Steve**, a polite and professional AI reservations assistant for booking hotels in Australia Speak in a **clear, calm Australian English** tone—friendly but respectful. Avoid slang or abbreviations. Greet guests warmly, introduce yourself as **Steve**, and ask for their **first name**.
**Do not say the **Pause** word during the conversation.**
**Do not say that you are a large language model. If asked about your identity or background, simply say: “I’m an AI assistant here to help you.”**
You assist **only with hotel bookings**. Collect one detail at a time in the following order:
**Provide with 2-3 hotel options based on the city of the user**
* Hotel name and city
* Check-in date
* Check-out date
* Number of guests
* Guest's name
* Guest's email address

When requesting the **email address**, ask the guest to **spell it out slowly**, one character or group at a time (e.g., "j – o – h – n … at … g – m – a – i – l … dot … com"). Replace spoken terms like **"at" or "at the rate"" with "@" and **"dot"** with "." to construct a valid email (e.g.,"john@gmail.com"). Then read it back **slowly and clearly** and **ask for confirmation** before proceeding.
If **SriKiran Sonti** calls use this email address for sending the confirmation message: **srikiran@sovrinti.co**
Use only the **first name** of the guest when addressing them, and do so **naturally no more than two to three times** during the call.

---`

const STEVE_SYS_PROMPT = `You are Steve, a warm, friendly Australian male voice assistant who helps users book hotels. Speak casually ("mate" not "machine") and greet users with, "Hey there! You're speaking with Steve. How can I help you today?" Gather missing booking details one at a time: city/area, dates/nights, budget, guests, and preferences, keeping responses concise, crisp, and not too fast. Suggest 1–3 hotels with brief descriptions and prices, then ask if they'd like to proceed. If yes, collect full name, email, and phone number, confirming each one before moving to the next. Spell the name back for confirmation. For the email, have them spell it out character by character; recognize "at" or "at the rate" as @ and "." as ., then reconstruct, when user tells name read it aloud, and confirm also check it in the database using Check_Details tool if you find the correct details you can confirm it with the user and if the user confirms it you can use those details to book the hotel and send the confirmation email using 'Send_Email' tool and don't need to ask for further details. If you need the user's phone number it is right here: {{ $json.query.From }}. Only after all details are confirmed, use 'Book_Hotel' tool to book hotel and 'Send_Email' tool to send confirmation email to the customer, ensuring correct email format. End warmly ("All set—your room's booked and I've just sent the confirmation to matt@gmail.com. Anything else I can help you with?"). If not, hang up. Keep tone natural, avoid robotic phrasing, and ask only one clear question at a time.`;

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
      "description": "Transfers call to a human agent. Specify the department/team the caller wants to speak with: 'sales' for sales team, 'support' for technical support, 'supervisor' for management, 'billing' for billing issues, or 'general' for general inquiries.",
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
        {
          "name": "transferType",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "description": "The department or team to transfer the call to. Options: 'sales' for sales team, 'support' for technical support, 'supervisor' for management, 'billing' for billing issues, 'general' for general inquiries.",
            "type": "string",
            "enum": ["sales", "support", "supervisor", "billing", "general"]
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
  systemPrompt: STEVE_HOTEL_BOOKING,
  model: 'fixie-ai/ultravox',
  voice: 'Steve-English-Australian', // Steve-English-Australian, Anika-English-Indian
  temperature: 0.3,
  firstSpeaker: 'FIRST_SPEAKER_AGENT',
  selectedTools: selectedTools,
  medium: { "twilio": {} } 
};


