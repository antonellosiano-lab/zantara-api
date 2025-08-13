import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Bali Zero Hub", async (prompt, data) => {
  await writeAgentResult("baliZeroHub", prompt, data);
});
