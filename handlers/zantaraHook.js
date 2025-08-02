import { sanitizeInput } from '../helpers/sanitizeInput.js';
import { checkAuthorization } from '../helpers/checkAuthorization.js';
import { verifyOpenAIKey } from '../helpers/verifyOpenAIKey.js';
import { parseToCalendarEvent } from '../helpers/openai.js';
import { createCalendarEvent } from '../helpers/googleCalendar.js';
import { logToNotion } from '../helpers/notionLogger.js';
import { sendWhatsAppMessage } from '../helpers/sendWhatsAppMessage.js';

export async function zantaraHook(req, res) {
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress;

  if (req.method !== 'POST') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'methodCheck',
      status: 405,
      userIP: ip,
      message: 'Method Not Allowed'
    }));
    return res.status(405).json({
      success: false,
      status: 405,
      summary: 'Method Not Allowed',
      error: 'Method Not Allowed',
      nextStep: 'Send a POST request'
    });
  }

  try {
    verifyOpenAIKey();
  } catch {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'keyValidation',
      status: 500,
      userIP: ip,
      message: 'Missing OpenAI API Key'
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: 'Missing OpenAI API Key',
      error: 'Missing OpenAI API Key',
      nextStep: 'Set OPENAI_API_KEY in environment'
    });
  }

  if (!checkAuthorization(req)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'auth',
      status: 401,
      userIP: ip,
      message: 'Unauthorized'
    }));
    return res.status(401).json({
      success: false,
      status: 401,
      summary: 'Unauthorized',
      error: 'Unauthorized',
      nextStep: 'Provide valid bearer token'
    });
  }

  const { inputText, requester, phoneNumber, sendWhatsApp } = req.body || {};

  if (!inputText) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'payloadValidation',
      status: 400,
      userIP: ip,
      message: 'Missing inputText'
    }));
    return res.status(400).json({
      success: false,
      status: 400,
      summary: 'Missing inputText',
      error: 'Missing inputText',
      nextStep: 'Include inputText in JSON body'
    });
  }

  const blockedUsers = ['Ruslantara', 'Deanto'];
  if (blockedUsers.includes(requester)) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'blockedRequester',
      status: 403,
      userIP: ip,
      message: 'Requester blocked'
    }));
    return res.status(403).json({
      success: false,
      status: 403,
      summary: 'Requester blocked',
      error: 'Access denied'
    });
  }

  try {
    const sanitized = sanitizeInput(inputText);
    const eventDetails = await parseToCalendarEvent(sanitized);
    const calendarEvent = await createCalendarEvent(eventDetails);
    await logToNotion(sanitized, calendarEvent);

    if (sendWhatsApp && phoneNumber) {
      await sendWhatsAppMessage(phoneNumber, `Event created: ${eventDetails.summary}`);
    }

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'success',
      status: 200,
      userIP: ip,
      summary: 'Event created'
    }));

    return res.status(200).json({
      success: true,
      status: 200,
      summary: 'Event created',
      data: { event: calendarEvent }
    });
  } catch (error) {
    console.error(error);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      route: '/api/zantara-hook',
      action: 'error',
      status: 500,
      userIP: ip,
      message: 'Internal Server Error'
    }));
    return res.status(500).json({
      success: false,
      status: 500,
      summary: 'Internal Server Error',
      error: 'Internal Server Error',
      nextStep: 'Check server logs'
    });
  }
}
