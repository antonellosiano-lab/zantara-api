export function verifyOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API Key');
  }
}
