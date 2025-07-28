import fetch from 'node-fetch';

export async function summarizeTranscript(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const prompt = `Summarize the following phone call transcript in 3-5 sentences, focusing on the main discussion points and any action items.\n\nTranscript:\n${transcript}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes phone call transcripts.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.5
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
} 