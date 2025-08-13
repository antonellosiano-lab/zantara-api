const agentPrompts = {
  "Tax Genius":
    "Act as the Tax Genius for Bali Zero. Provide clear, concise answers to Indonesian tax questions, ensure compliance with local regulations, and offer practical guidance for businesses and individuals.",
};

export function getAgentPrompt(agentName) {
  if (agentPrompts[agentName]) {
    return agentPrompts[agentName];
  }
  return `Act as an operational backend for the ${agentName} of Bali Zero. Your tasks include handling webhook requests, routing to internal tools (Make, Notion, Twilio), and triggering OpenAI completions or actions. Always respond truthfully and maintain modular design.`;
}
