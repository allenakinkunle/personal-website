import { responseJson, upsertEmailOctopusContact, verifyTurnstile } from '../_lib/newsletter.js';

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validTopics = new Set(['tech', 'life']);

export async function onRequestPost({ request, env }) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    const input = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
    const email = String(input.email ?? '').trim().toLowerCase();
    const requestedTopics = Array.isArray(input.topics)
      ? input.topics
      : String(input.topics ?? '').split(',');
    const topics = [...new Set(requestedTopics.filter((topic) => validTopics.has(topic)))];

    if (!validEmail.test(email) || !topics.length) {
      return responseJson({ ok: false, message: 'Enter a valid email and select at least one list.' }, 400);
    }
    if (!await verifyTurnstile(request, input.turnstileToken, env.TURNSTILE_SECRET_KEY)) {
      return responseJson({ ok: false, message: 'The security check could not be completed.' }, 400);
    }

    await upsertEmailOctopusContact(env, { email, topics });

    await env.NEWSLETTER_DB.prepare(`
      INSERT INTO subscribers (email, status, source, confirmed_at)
      VALUES (?1, 'active', 'website', CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        status = 'active',
        confirmed_at = CURRENT_TIMESTAMP,
        unsubscribed_at = NULL
    `).bind(email).run();

    const subscriber = await env.NEWSLETTER_DB.prepare('SELECT id FROM subscribers WHERE email = ?1')
      .bind(email)
      .first();
    await env.NEWSLETTER_DB.prepare('DELETE FROM subscriber_topics WHERE subscriber_id = ?1')
      .bind(subscriber.id)
      .run();
    await env.NEWSLETTER_DB.batch(topics.map((topic) => env.NEWSLETTER_DB
      .prepare('INSERT INTO subscriber_topics (subscriber_id, topic) VALUES (?1, ?2)')
      .bind(subscriber.id, topic)));

    return responseJson({ ok: true, message: 'You are subscribed. Welcome.' });
  } catch (error) {
    console.error(error);
    return responseJson({ ok: false, message: 'Subscription is temporarily unavailable.' }, 500);
  }
}
