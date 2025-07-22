import dotenv from 'dotenv';
dotenv.config();

import xlsx from 'xlsx';
import { makeOutboundCall } from '../utils/outboundCall.js';
import { OUTBOUND_CALL_CONFIG } from '../config/outbound-config.js';
import { addCallMapping } from '../utils/callMapping.js';

const EXCEL_PATH = './data/User-to-call.xlsx';
const CONCURRENCY_LIMIT = 5;

function readRowsFromExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  // Each row: { phoneNumbers, CurrentOutstanding, DueDate, DaysOverdue }
  return data.filter(row => row.PhoneNumber);
}

function generatePrompt(basePrompt, row) {
  return `Customer details:\n- Phone: ${row.Name}\n- Phone: ${row.PhoneNumber}\n- Current Outstanding: ${row.CurrentOutstanding}\n- Due Date: ${row.DueDate}\n- Days Overdue: ${row.DaysOverdue}\n\n${basePrompt}`;
}

async function callWithConcurrency(rows, baseConfig) {
  let index = 0;
  let active = 0;
  let results = [];

  return new Promise((resolve) => {
    function next() {
      while (active < CONCURRENCY_LIMIT && index < rows.length) {
        const row = rows[index++];
        active++;
        // Generate dynamic prompt for this customer
        const prompt = generatePrompt(baseConfig.systemPrompt, row);
        const config = { ...baseConfig, systemPrompt: prompt };
        makeOutboundCall(row.PhoneNumber, config)
          .then(async ({ callId, sid }) => {
            console.log(`SUCCESS: ${row.PhoneNumber} -> Ultravox Call ID: ${callId}, Twilio SID: ${sid}`);
            await addCallMapping(callId, row.PhoneNumber);
            results.push({ phoneNumber: row.PhoneNumber, callId, sid, status: 'success' });
          })
          .catch(err => {
            console.error(`FAIL: ${row.PhoneNumber} -> ${err.message}`);
            results.push({ phoneNumber: row.PhoneNumber, error: err.message, status: 'fail' });
          })
          .finally(() => {
            active--;
            if (results.length === rows.length) {
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
  const rows = readRowsFromExcel(EXCEL_PATH);
  console.log(`Read ${rows.length} rows from Excel.`);
  if (rows.length === 0) {
    console.log('No phone numbers found. Exiting.');
    return;
  }
  const results = await callWithConcurrency(rows, { ...OUTBOUND_CALL_CONFIG });
  console.log('All calls processed. Results:', results);
}

main(); 