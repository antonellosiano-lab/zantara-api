import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Visa Oracle", async (prompt, data) => {
  await writeAgentResult("visaOracle", prompt, data);
});
