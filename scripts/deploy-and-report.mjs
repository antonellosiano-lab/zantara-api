import fs from "fs";

async function main() {
  const domain = process.env.VERCEL_URL || "example.vercel.app";
  const baseUrl = `https://${domain}/api`;
  const endpoint = `${baseUrl}/zion`;

  const openapiPath = "gpt/openapi.zion.json";
  const spec = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
  spec.servers = [{ url: baseUrl }];
  fs.writeFileSync(openapiPath, JSON.stringify(spec, null, 2));

  console.log(`ZION_ENDPOINT=${endpoint}`);
  console.log(`ZION_SERVERS_URL=${baseUrl}`);
  console.log(`OPENAPI_PATH=/gpt/openapi.zion.json`);
}

main();
