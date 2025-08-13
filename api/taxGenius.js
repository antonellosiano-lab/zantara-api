import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Tax Genius", async (prompt, data) => {
  await writeAgentResult("taxGenius", prompt, data);
});
