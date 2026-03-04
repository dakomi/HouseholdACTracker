import { Router, Request, Response, NextFunction } from 'express';
import { handleMessengerEvent } from '../services/messengerBot';

const router = Router();

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || 'default_verify_token';

// GET /api/bot/webhook — Facebook webhook verification
router.get('/webhook', (req: Request, res: Response) => {
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
  try {
    await handleMessengerEvent(req.body);
    res.status(200).json({ data: 'EVENT_RECEIVED', error: null });
  } catch (err) {
    next(err);
  }
});

export default router;
