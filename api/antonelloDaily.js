import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Antonello Daily", async (prompt, data) => {
  await writeAgentResult("antonelloDaily", prompt, data);
});
