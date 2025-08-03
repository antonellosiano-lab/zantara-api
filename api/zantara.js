import { zantaraHandler } from "../handlers/zantaraHandler.js";

export default async function handler(req, res) {
  await zantaraHandler(req, res);
}
