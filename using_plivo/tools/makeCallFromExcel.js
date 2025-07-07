import dotenv from 'dotenv';
dotenv.config();

import xlsx from 'xlsx';
import { makeOutboundCall } from '../utils/outboundCall.js';
import { ULTRAVOX_CALL_CONFIG as ANIKA_CONFIG } from '../config/ultravox-config-anika.js';

const EXCEL_PATH = './data/User-to-call.xlsx';
const CONCURRENCY_LIMIT = 5;

function readPhoneNumbersFromExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  // Expecting a column named 'phoneNumbers'
  return data.map(row => String(row.phoneNumbers)).filter(Boolean);
}

async function callWithConcurrency(phoneNumbers, config) {
  let index = 0;
  let active = 0;
  let results = [];

  return new Promise((resolve) => {
    function next() {
      while (active < CONCURRENCY_LIMIT && index < phoneNumbers.length) {
        const phoneNumber = phoneNumbers[index++];
        active++;
        makeOutboundCall(phoneNumber, config)
          .then(sid => {
            console.log(`SUCCESS: ${phoneNumber} -> Call SID: ${sid}`);
            results.push({ phoneNumber, sid, status: 'success' });
          })
          .catch(err => {
            console.error(`FAIL: ${phoneNumber} -> ${err.message}`);
            results.push({ phoneNumber, error: err.message, status: 'fail' });
          })
          .finally(() => {
            active--;
            if (results.length === phoneNumbers.length) {
              resolve(results);
            } else {
              next();
            }
          });
      }
    }
    next();
  });
}

async function main() {
  const phoneNumbers = readPhoneNumbersFromExcel(EXCEL_PATH);
  console.log(`Read ${phoneNumbers.length} phone numbers from Excel.`);
  if (phoneNumbers.length === 0) {
    console.log('No phone numbers found. Exiting.');
    return;
  }
  const results = await callWithConcurrency(phoneNumbers, { ...ANIKA_CONFIG });
  console.log('All calls processed. Results:', results);
}

main(); 