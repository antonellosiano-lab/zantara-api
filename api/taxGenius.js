import { initObservability } from "../lib/observability.js";
initObservability();

import { createAgentHandler } from "../handlers/createAgentHandler.js";

export default createAgentHandler("Tax Genius");
