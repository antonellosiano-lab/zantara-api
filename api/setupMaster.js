import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Setup Master", async (prompt, data) => {
  await writeAgentResult("setupMaster", prompt, data);
});
