import pricebookHandler from "../../../handlers/pricebookHandler.js";

export default async function handler(req, res) {
  await pricebookHandler(req, res);
}
