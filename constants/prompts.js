const PROMPTS = {
  "Setup Master":
    "Act as the Setup Master for Bali Zero. Provide clear step-by-step guidance for configuration tasks and verify that each component is ready for production.",
};

export function getAgentPrompt(agentName) {
  return (
    PROMPTS[agentName] ||
    `Act as an operational backend for the ${agentName} of Bali Zero. Your tasks include handling webhook requests, routing to internal tools (Make, Notion, Twilio), and triggering OpenAI completions or actions. Always respond truthfully and maintain modular design.`
  );
}

