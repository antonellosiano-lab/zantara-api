import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { writeAgentResult } from "../helpers/notionLogger.js";

export default createAgentHandler("Zantara Pro Power", async (prompt, data) => {
  await writeAgentResult("zantaraProPower", prompt, data);
});
