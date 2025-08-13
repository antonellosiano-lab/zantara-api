import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("The Legal Architect", async (prompt, data) => {
  await writeAgentResult("theLegalArchitect", prompt, data);
});
