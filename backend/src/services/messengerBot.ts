import axios from 'axios';
import prisma from '../prisma/client';

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';

async function sendMessage(recipientId: string, text: string): Promise<void> {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn('MESSENGER_PAGE_ACCESS_TOKEN not set, skipping message send');
    return;
  }
  await axios.post(
    'https://graph.facebook.com/v18.0/me/messages',
    {
      recipient: { id: recipientId },
      message: { text },
    },
    { params: { access_token: PAGE_ACCESS_TOKEN } }
  );
}

function parseZoneName(text: string): string | null {
  const lower = text.toLowerCase();
  const zoneKeywords: Record<string, string[]> = {
    'Living Room': ['living', 'living room'],
    'Master Bedroom': ['master', 'master bedroom'],
    'Bedroom 2': ['bedroom 2', 'bed 2', 'second bedroom'],
    'Dining Room': ['dining', 'dining room'],
  };
  for (const [zoneName, keywords] of Object.entries(zoneKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return zoneName;
    }
  }
  return null;
}

export async function handleMessengerEvent(body: {
  object: string;
  entry: Array<{
    messaging: Array<{
      sender: { id: string };
      message?: { text: string };
    }>;
  }>;
}): Promise<void> {
  if (body.object !== 'page') return;

  for (const entry of body.entry) {
    for (const event of entry.messaging) {
      const senderId = event.sender.id;
      const messageText = event.message?.text?.trim().toLowerCase();
      if (!messageText) continue;

      await processCommand(senderId, messageText);
    }
  }
}

async function processCommand(senderId: string, text: string): Promise<void> {
  try {
    if (text.startsWith('ac on')) {
      await handleAcOn(senderId, text);
    } else if (text === 'ac off') {
      await handleAcOff(senderId);
    } else if (text === 'ac status') {
      await handleAcStatus(senderId);
    } else if (text === 'ac history') {
      await handleAcHistory(senderId);
    } else if (text.startsWith('ac edit')) {
      await handleAcEdit(senderId, text);
    } else if (text === 'ac help') {
      await handleAcHelp(senderId);
    } else {
      await sendMessage(
        senderId,
        'Unknown command. Send "ac help" for available commands.'
      );
    }
  } catch (err) {
    console.error('Error processing messenger command:', err);
    await sendMessage(senderId, 'An error occurred processing your request.');
  }
}

async function handleAcOn(senderId: string, text: string): Promise<void> {
  const zoneName = parseZoneName(text);
  if (!zoneName) {
    await sendMessage(
      senderId,
      'Please specify a zone. E.g., "ac on living room"'
    );
    return;
  }

  const zone = await prisma.zone.findFirst({ where: { name: zoneName } });
  if (!zone) {
    await sendMessage(senderId, `Zone "${zoneName}" not found.`);
    return;
  }

  // Find first user (placeholder - real impl would link sender to user)
  const user = await prisma.user.findFirst();
  if (!user) {
    await sendMessage(senderId, 'No users found in system.');
    return;
  }

  const session = await prisma.session.create({
    data: {
      user_id: user.id,
      start_time: new Date(),
      zones: { create: [{ zone_id: zone.id }] },
      sessionZoneLogs: {
        create: [
          {
            zone_id: zone.id,
            activated_by: user.id,
            activated_at: new Date(),
          },
        ],
      },
    },
  });

  await sendMessage(
    senderId,
    `✅ AC started in ${zoneName} (Session #${session.id}) for ${user.name}.`
  );
}

async function handleAcOff(senderId: string): Promise<void> {
  const activeSessions = await prisma.session.findMany({
    where: { end_time: null },
    include: { user: true, zones: { include: { zone: true } } },
  });

  if (activeSessions.length === 0) {
    await sendMessage(senderId, 'No active sessions to stop.');
    return;
  }

  const now = new Date();
  await prisma.session.updateMany({
    where: { end_time: null },
    data: { end_time: now },
  });

  const names = activeSessions.map((s) => s.user.name).join(', ');
  await sendMessage(senderId, `🛑 Ended ${activeSessions.length} active session(s) for: ${names}.`);
}

async function handleAcStatus(senderId: string): Promise<void> {
  const activeSessions = await prisma.session.findMany({
    where: { end_time: null },
    include: { user: true, zones: { include: { zone: true } } },
  });

  if (activeSessions.length === 0) {
    await sendMessage(senderId, '💤 No active AC sessions.');
    return;
  }

  const lines = activeSessions.map((s) => {
    const zones = s.zones.map((sz) => sz.zone.name).join(', ');
    const duration = Math.round(
      (Date.now() - s.start_time.getTime()) / 60000
    );
    return `• ${s.user.name}: ${zones} (${duration} min)`;
  });

  await sendMessage(senderId, `🌡️ Active sessions:\n${lines.join('\n')}`);
}

async function handleAcHistory(senderId: string): Promise<void> {
  const sessions = await prisma.session.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { user: true, zones: { include: { zone: true } } },
  });

  if (sessions.length === 0) {
    await sendMessage(senderId, 'No session history found.');
    return;
  }

  const lines = sessions.map((s, i) => {
    const zones = s.zones.map((sz) => sz.zone.name).join(', ');
    const start = s.start_time.toLocaleString();
    const end = s.end_time ? s.end_time.toLocaleString() : 'ongoing';
    return `${i + 1}. ${s.user.name} — ${zones}\n   ${start} → ${end}`;
  });

  await sendMessage(senderId, `📋 Last 5 sessions:\n${lines.join('\n\n')}`);
}

async function handleAcEdit(senderId: string, text: string): Promise<void> {
  const match = text.match(/ac edit (\d)/);
  const index = match ? parseInt(match[1], 10) - 1 : -1;

  if (index < 0 || index > 4) {
    await sendMessage(senderId, 'Usage: "ac edit [1-5]" to edit a recent session.');
    return;
  }

  const sessions = await prisma.session.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { user: true },
  });

  const session = sessions[index];
  if (!session) {
    await sendMessage(senderId, `No session found at position ${index + 1}.`);
    return;
  }

  await sendMessage(
    senderId,
    `✏️ Session #${session.id} (${session.user.name}): To edit, use the app UI or API.\nStart: ${session.start_time.toLocaleString()}\nEnd: ${session.end_time?.toLocaleString() ?? 'ongoing'}`
  );
}

async function handleAcHelp(senderId: string): Promise<void> {
  await sendMessage(
    senderId,
    `🤖 AC Tracker Bot Commands:
• ac on [zone] — Start AC in a zone
• ac off — Stop all active sessions
• ac status — Show active sessions
• ac history — Show last 5 sessions
• ac edit [1-5] — View recent session details
• ac help — Show this help

Zones: Living Room, Master Bedroom, Bedroom 2, Dining Room`
  );
}
