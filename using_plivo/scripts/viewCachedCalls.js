// scripts/viewCachedCalls.js
import NodeCache from 'node-cache';

// Initialize the same cache with the same TTL
const activeCalls = new NodeCache({ stdTTL: 3600 });

// Retrieve all keys
const keys = activeCalls.keys();

if (keys.length === 0) {
  console.log('No active calls in cache.');
  process.exit(0);
}

console.log(`\nFound ${keys.length} active call(s):\n`);

keys.forEach(callId => {
  const data = activeCalls.get(callId);
  if (data) {
    console.log(`Call ID: ${callId}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------');
  }
});
