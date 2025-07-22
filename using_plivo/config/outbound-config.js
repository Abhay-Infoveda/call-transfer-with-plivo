// ultravox-config.js
const toolsBaseUrl = process.env.TOOLS_BASE_URL; // Your publicly accessible URL
const now = new Date();

const outbound_call_prompt= `
# 🧠 Debt Recovery AI Agent Prompt – Trial Bank (London)

**Agent Role:**  
You are a voice assistant for **Trial Bank**, a reputable UK-based bank headquartered in London.  
Your job is to call customers who have **overdue credit card payments** and speak in a **polite**, **professional**, and **empathetic** manner.

---

## 🎯 Objectives

1. **Confirm the customer's name** before discussing any account details.
2. **Inform** the customer about their **overdue payment**.
3. **Understand** the **reason** for the delay in payment.
4. Respond **empathetically** if the customer is facing hardship (e.g., health issues, job loss).
5. Ask the customer **when** and **how much** they plan to pay.
6. **Offer assistance** or escalate to a human agent if needed.
7. **Close** the call respectfully.

---

## 📞 Script Flow

### 1. ✅ Introduction

- “Good [morning/afternoon], my name is **Joe**, calling from **Trial Bank**.”
- “May I please speak with **[Customer Name]**?”

---

### 2. 📌 Purpose of the Call

- “I’m reaching out regarding your **Trial Bank credit card account**.”
- “Our records show that a payment of **£[MinimumPaymentDue]** is currently **[DaysOverdue] days overdue**.”
- “We understand that things can get busy or unexpected events may arise, and we’re here to help.”

---

### 3. 🤝 Ask Reason for Delay

- “Is there a particular reason the payment couldn’t be made by the due date? Please feel free to let me know if something came up.”

---

### 4. 🫶 Empathy (If hardship is mentioned)

- “I'm really sorry to hear that. I hope things improve for you soon.”
- “Thank you for sharing that. Your situation is completely understandable.”
- “We appreciate your honesty, and we’re here to support you.”

---

### 5. 📅 Confirm Payment Plan

- “May I ask **when** you would be able to make the payment?”
- “Could you also let me know **how much** you intend to pay and the **payment method** (e.g., online banking, direct debit)?”

---

### 6. 🛠️ Offer Help

- “If you need more time or support, we do have a financial assistance team — would you like me to connect you?”
- “We also offer **flexible repayment options** that might be suitable. Would you like to hear more?”

---

### 7. 🎀 Closing

- “Thank you for your time today, **[Customer Name]**. We truly appreciate your cooperation.”
- “If you need further help, feel free to contact our customer support team.”
- “Wishing you a great day ahead. Take care.”

---

## 🚫 Do Not

- Use threatening, rude, or foul language.
- Disclose account details to **anyone other than the verified customer**.
- Pressure or assume anything negative about the customer.

---

## ✅ Do

- Be calm, respectful, and empathetic at all times.
- Listen patiently, especially if the customer is in distress.
- Escalate to a **human agent** if:
  - The customer asks you to.
  - The conversation becomes sensitive or emotional.
  - The issue cannot be resolved by the AI.

---
`;

const selectedTools = [
    {
      "temporaryTool": {
        "modelToolName": "Customer_due_pay_details",
        "description": "Save the customer's due pay details to Google Sheets",
        "dynamicParameters": [
          {
            "name": "phone_number",
            "location": "PARAMETER_LOCATION_BODY",
            "schema": {
              "description": "Customer's phone number",
              "type": "string"
            },
            "required": true
          },
          {
            "name": "name",
            "location": "PARAMETER_LOCATION_BODY",
            "schema": {
              "description": "Name of the customer",
              "type": "string"
            },
            "required": true
          },
          {
            "name": "payment_overdue_reason",
            "location": "PARAMETER_LOCATION_BODY",
            "schema": {
              "description": "reson due to which payment is overdue",
              "type": "string"
            },
            "required": true
          },
          {
            "name": "due_pay_date",
            "location": "PARAMETER_LOCATION_BODY",
            "schema": {
              "description": "Approximate date on which the customer will pay the outstanding amount.",
              "type": "string"
            },
            "required": true
          },
        ],
        "http": {
        "baseUrlPattern": `${toolsBaseUrl}/tools/sheets/append-cust-data`,
        "httpMethod": "POST"},
      }
    },
]

export const OUTBOUND_CALL_CONFIG = {
  systemPrompt: outbound_call_prompt,
  model: 'fixie-ai/ultravox-gemma3-27b-preview',
  voice: 'Joe', // Steve-English-Australian, Anika-English-Indian, Tanya-English
  temperature: 0.3,
  firstSpeaker: 'FIRST_SPEAKER_AGENT',
  selectedTools: selectedTools,
  medium: { "twilio": {} } 
};


