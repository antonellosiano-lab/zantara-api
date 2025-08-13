import { getSponsorFitnessHandler } from "../../handlers/getSponsorFitnessHandler.js";

export default async function handler(req, res) {
  await getSponsorFitnessHandler(req, res);
}
