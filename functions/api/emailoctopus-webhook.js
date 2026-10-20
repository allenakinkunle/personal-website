import { verifyEmailOctopusWebhook } from '../_lib/newsletter.js';

const statusMap = {
  SUBSCRIBED: 'active',
  PENDING: 'pending',
  UNSUBSCRIBED: 'unsubscribed',
  BOUNCED: 'bounced',
  COMPLAINED: 'complained',
};

const eventStatusMap = {
  'contact.unsubscribed': 'unsubscribed',
  'contact.bounced': 'bounced',
  'contact.complained': 'complained',
  'contact.deleted': 'unsubscribed',
};

export async function onRequestPost({ request, env }) {
  const body = await request.text();
  const signature = request.headers.get('EmailOctopus-Signature');
  if (!await verifyEmailOctopusWebhook(body, signature, env.EMAILOCTOPUS_WEBHOOK_SECRET)) {
    return new Response('Invalid signature.', { status: 401 });
  }

  const events = JSON.parse(body);
  for (const event of events) {
    if (event.list_id !== env.EMAILOCTOPUS_LIST_ID || !event.contact_email_address) continue;
    const email = event.contact_email_address.trim().toLowerCase();
    const status = statusMap[event.contact_status] ?? eventStatusMap[event.type] ?? null;

    if (status) {
      await env.NEWSLETTER_DB.prepare(`
        INSERT INTO subscribers (email, status, source, confirmed_at, unsubscribed_at)
        VALUES (?1, ?2, 'emailoctopus', CASE WHEN ?2 = 'active' THEN CURRENT_TIMESTAMP END, CASE WHEN ?2 = 'unsubscribed' THEN CURRENT_TIMESTAMP END)
        ON CONFLICT(email) DO UPDATE SET
          status = ?2,
          confirmed_at = CASE WHEN ?2 = 'active' THEN COALESCE(subscribers.confirmed_at, CURRENT_TIMESTAMP) ELSE subscribers.confirmed_at END,
          unsubscribed_at = CASE WHEN ?2 = 'unsubscribed' THEN CURRENT_TIMESTAMP ELSE NULL END
      `).bind(email, status).run();
    }

    if (Array.isArray(event.contact_tags)) {
      const subscriber = await env.NEWSLETTER_DB.prepare('SELECT id FROM subscribers WHERE email = ?1')
        .bind(email)
        .first();
      if (!subscriber) continue;
      const topics = event.contact_tags.filter((tag) => tag === 'tech' || tag === 'life');
      await env.NEWSLETTER_DB.prepare('DELETE FROM subscriber_topics WHERE subscriber_id = ?1')
        .bind(subscriber.id)
        .run();
      if (topics.length) {
        await env.NEWSLETTER_DB.batch(topics.map((topic) => env.NEWSLETTER_DB
          .prepare('INSERT INTO subscriber_topics (subscriber_id, topic) VALUES (?1, ?2)')
          .bind(subscriber.id, topic)));
      }
    }
  }

  return new Response(null, { status: 204 });
}
