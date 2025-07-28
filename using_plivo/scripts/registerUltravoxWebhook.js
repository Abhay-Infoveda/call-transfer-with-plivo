import fetch from 'node-fetch';
import 'dotenv/config';

(async () => {
  const response = await fetch('https://api.ultravox.ai/api/webhooks', {
    method: 'POST',
    headers: {
      'X-API-Key': 'HsbqEahv.y2ninNJbFsv30aI6GP7RYBtGdLlHgHkO',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: 'https://256fa192a489.ngrok-free.app/ultravox/webhook',
      events: ['call.ended']
    })
  });
  const data = await response.json();
  console.log('Ultravox webhook registration response:', data);
})(); 