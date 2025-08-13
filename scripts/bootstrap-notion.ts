import { Client } from "@notionhq/client";
import fs from "fs";
import path from "path";

async function main() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const routingPath = path.join(process.cwd(), "gpt/knowledge/zion_routing.json");

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action: "bootstrap-notion",
    status: "starting"
  }));

  const routing = {
    notion: {
      tasks_db_id: process.env.TASKS_DB_ID || "",
      meetings_db_id: process.env.MEETINGS_DB_ID || "",
      logs_db_id: process.env.DEFAULT_NOTION_LOG_DB || "",
      projects_db_id: process.env.PROJECTS_DB_ID || "",
      contacts_db_id: process.env.CONTACTS_DB_ID || "",
      scenarios_db_id: process.env.SCENARIOS_DB_ID || ""
    },
    drive: {
      root_folder_id: process.env.DRIVE_ROOT_FOLDER_ID || ""
    }
  };

  fs.writeFileSync(routingPath, JSON.stringify(routing, null, 2));

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action: "bootstrap-notion",
    status: "completed",
    routingPath
  }));
}

main().catch(err => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    action: "bootstrap-notion",
    status: "error",
    error: err.message
  }));
  process.exit(1);
});
