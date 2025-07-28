import xlsx from 'xlsx';

const EXCEL_PATH = './data/User-to-call.xlsx';

export function getCalleeEmailByPhoneNumber(phoneNumber) {
  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  // Normalize phone number for comparison
  const normalized = String(phoneNumber).replace(/\D/g, '');
  const row = data.find(row => String(row.PhoneNumber).replace(/\D/g, '') === normalized);
  return row ? row.Email : null;
} 