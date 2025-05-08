// ultravox-utils.js
import https from 'node:https';
import 'dotenv/config';

// Configuration
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = 'https://api.ultravox.ai/api';

// Create Ultravox call and get join URL
export async function createUltravoxCall(callConfig) {
  console.log('Creating Ultravox call with config:', JSON.stringify(callConfig, null, 2));
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ULTRAVOX_API_KEY
      }
    };
    
    console.log(`Sending request to ${ULTRAVOX_API_URL}/calls`);
    
    const req = https.request(`${ULTRAVOX_API_URL}/calls`, options, (res) => {
      console.log(`Ultravox API Status Code: ${res.statusCode}`);
      console.log(`Ultravox API Headers: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check if response is success (2xx status code)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            console.log('Ultravox API Response:', JSON.stringify(jsonData, null, 2));
            resolve(jsonData);
          } catch (e) {
            console.error('Error parsing JSON response:', e);
            console.error('Raw response data:', data);
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        } else {
          console.error('Ultravox API Error Response:', data);
          reject(new Error(`Ultravox API returned error status: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making request to Ultravox API:', error.message);
      reject(error);
    });
    
    req.write(JSON.stringify(callConfig));
    req.end();
  });
}

// Get call transcript for logging/debugging purposes
export async function getCallTranscript(callId) {
  let allMessages = [];
  let nextCursor = null;
  
  try {
    // Keep fetching until we have all messages
    do {
      const url = `${ULTRAVOX_API_URL}/calls/${callId}/messages${nextCursor ? `?cursor=${nextCursor}` : ''}`;
      console.log(`Fetching messages from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': ULTRAVOX_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.results ? data.results.length : 0} messages`);
      
      // Add the current page of results to our collection
      allMessages = allMessages.concat(data.results || []);
      
      // Update the cursor for the next iteration
      nextCursor = data.next ? new URL(data.next).searchParams.get('cursor') : null;
    } while (nextCursor);
    
    return allMessages;
  } catch (error) {
    console.error('Error fetching Ultravox messages:', error.message);
    throw error;
  }
}