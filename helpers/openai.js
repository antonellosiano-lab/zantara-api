import { zantaraPrompt } from '../constants/prompt.js';

export async function parseToCalendarEvent(text) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: zantaraPrompt },
        { role: 'user', content: text }
      ]
    })
  });
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  let event;
  try {
    event = JSON.parse(content);
  } catch {
    event = { summary: content };
  }
  return event;
}
