import { createAgentHandler } from "../handlers/createAgentHandler.js";
import { postToProPowerAPI } from "../helpers/postToProPowerAPI.js";

export default createAgentHandler("zantaraProPower", async (prompt, result) => {
  const proPower = await postToProPowerAPI(prompt, result);

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/zantaraProPower",
      action: "forwardToProPower",
      status: proPower.status,
      summary: proPower.summary
    })
  );

  result.proPower = proPower;
});
