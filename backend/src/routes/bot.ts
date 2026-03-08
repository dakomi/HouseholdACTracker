import crypto from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import { handleMessengerEvent } from '../services/messengerBot';

const router = Router();

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN;
const APP_SECRET   = process.env.MESSENGER_APP_SECRET;

if (!VERIFY_TOKEN) {
  console.warn(
    '[bot] WARNING: MESSENGER_VERIFY_TOKEN is not set. ' +
    'The messenger webhook endpoint will return 503 until it is configured.'
  );
}
if (!APP_SECRET) {
  console.warn(
    '[bot] WARNING: MESSENGER_APP_SECRET is not set. ' +
    'Incoming webhook payloads will not be signature-verified.'
  );
}

/**
 * Verify the X-Hub-Signature-256 header sent by Facebook on every POST.
 * Returns true when the header is valid, false otherwise.
 * When APP_SECRET is not configured, verification is skipped and true is
 * returned only in development (NODE_ENV !== 'production').
 */
function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!APP_SECRET) {
    // Refuse unverified payloads in production; allow in development for
    // easier local testing without a real Facebook app.
    return process.env.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

// GET /api/bot/webhook — Facebook webhook verification
router.get('/webhook', (req: Request, res: Response) => {
  if (!VERIFY_TOKEN) {
    res.status(503).json({ data: null, error: 'Messenger webhook is not configured' });
    return;
  }

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ data: null, error: 'Verification failed' });
  }
});

// POST /api/bot/webhook — Receive messages
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  if (!VERIFY_TOKEN) {
    res.status(503).json({ data: null, error: 'Messenger webhook is not configured' });
    return;
  }

  // Validate the HMAC signature supplied by Facebook.
  // req.rawBody is set by the express.json() verify callback in app.ts.
  // If it is absent for any reason, refuse the request rather than
  // computing HMAC against a re-serialised (potentially different) payload.
  if (!req.rawBody) {
    res.status(400).json({ data: null, error: 'Unable to verify request signature' });
    return;
  }
  if (!verifySignature(req.rawBody, req.headers['x-hub-signature-256'] as string | undefined)) {
    res.status(403).json({ data: null, error: 'Invalid signature' });
    return;
  }

  try {
    await handleMessengerEvent(req.body);
    res.status(200).json({ data: 'EVENT_RECEIVED', error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
