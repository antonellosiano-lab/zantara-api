import { zantaraHook } from '../handlers/zantaraHook.js';

export default async function handler(req, res) {
  await zantaraHook(req, res);
}
