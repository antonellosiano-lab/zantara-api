import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Morgana", async (prompt, data) => {
  await writeAgentResult("morgana", prompt, data);
});
