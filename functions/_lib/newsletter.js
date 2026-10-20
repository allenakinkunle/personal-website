const encoder = new TextEncoder();

export const responseJson = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' },
});

export const verifyTurnstile = async (request, token, secret) => {
  if (!secret) return true;
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token ?? '');
  form.set('remoteip', request.headers.get('CF-Connecting-IP') ?? '');
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const data = await result.json();
  return data.success === true;
};

export const upsertEmailOctopusContact = async (env, { email, topics }) => {
  if (!env.EMAILOCTOPUS_API_KEY || !env.EMAILOCTOPUS_LIST_ID) {
    throw new Error('EmailOctopus is not configured.');
  }

  const result = await fetch(`https://api.emailoctopus.com/lists/${env.EMAILOCTOPUS_LIST_ID}/contacts`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${env.EMAILOCTOPUS_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      tags: {
        tech: topics.includes('tech'),
        life: topics.includes('life'),
      },
    }),
  });

  if (!result.ok) {
    const problem = await result.json().catch(() => null);
    throw new Error(problem?.detail ?? `EmailOctopus rejected the subscription (${result.status}).`);
  }

  return result.json();
};

const hexToBytes = (value) => {
  if (!/^[a-f\d]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
};

export const verifyEmailOctopusWebhook = async (body, signature, secret) => {
  if (!secret || !signature?.startsWith('sha256=')) return false;
  const signatureBytes = hexToBytes(signature.slice(7));
  if (!signatureBytes) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body));
};
