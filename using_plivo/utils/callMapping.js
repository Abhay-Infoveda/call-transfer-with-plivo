import fs from 'fs/promises';
const MAPPING_FILE = './callMappings.json';

export async function addCallMapping(callId, phoneNumber) {
  let data = {};
  try {
    data = JSON.parse(await fs.readFile(MAPPING_FILE, 'utf8'));
  } catch (e) {
    // File may not exist yet
  }
  data[callId] = { phoneNumber, timestamp: new Date().toISOString() };
  await fs.writeFile(MAPPING_FILE, JSON.stringify(data, null, 2));
}

export async function getPhoneNumberByCallId(callId) {
  try {
    const data = JSON.parse(await fs.readFile(MAPPING_FILE, 'utf8'));
    return data[callId]?.phoneNumber || null;
  } catch (e) {
    return null;
  }
} 