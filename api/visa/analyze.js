import { visaAnalyzeHandler } from "../../handlers/visaAnalyzeHandler.js";

export default async function handler(req, res) {
  await visaAnalyzeHandler(req, res);
}
