// utils/tokenStore.js
import fs from 'fs';

const TOKEN_FILE = './userTokensDB.json';

export function getToken(email) {
  const db = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  return db[email];
}

export function saveToken(email, token) {
  const db = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  db[email] = { email, ...token };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(db, null, 2));
}
