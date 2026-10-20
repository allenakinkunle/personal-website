# Newsletter setup

The site stays static. EmailOctopus sends campaigns from `notes@allenkunle.me`, while Cloudflare Pages Functions handle the custom signup form and D1 keeps a portable copy of the contact list.

Use the regular EmailOctopus service, not **EmailOctopus Connect**. Connect requires an Amazon SES account.

## EmailOctopus

1. Create a free EmailOctopus account and keep the default contact list, or create one named `Allen Akin`.
2. Add and verify `notes@allenkunle.me` as the sender.
3. Add the postal address EmailOctopus requires in campaign footers. A business address, PO box, or mail-forwarding address can be used.
4. Create two contact tags named exactly `life` and `tech`.
5. Create two saved segments: **Life.doc** where the `life` tag is present, and **Tech Notes** where the `tech` tag is present.
6. Generate a v2 API key and copy the list ID.
7. Import `.newsletter/emailoctopus-contacts.csv`, mapping its tag column to EmailOctopus tags. These existing Substack readers all receive the `life` tag.
8. Create a webhook pointing to `https://allenkunle.me/api/emailoctopus-webhook`. Include contact created, updated, unsubscribed, bounced, complained, and deleted events. Copy its signing secret.

The free plan supports 2,500 subscribers and 10,000 emails per month. With 367 readers, that is about 27 full-list sends each month. Free-plan emails include a small EmailOctopus badge.

## Cloudflare

1. Create a D1 database named `allen-newsletter`.
2. Apply `migrations/0001_newsletter.sql` to it.
3. In the Pages project, add a D1 binding named `NEWSLETTER_DB` for production and preview.
4. Add `EMAILOCTOPUS_API_KEY`, `EMAILOCTOPUS_LIST_ID`, and `EMAILOCTOPUS_WEBHOOK_SECRET` from `.dev.vars.example` under **Settings > Variables and Secrets**.
5. Create a Turnstile widget for `allenkunle.me` and add both Turnstile variables.
6. Redeploy after adding the binding and secrets.

The prepared subscriber files are intentionally ignored by Git. Import the D1 copy with:

```sh
npx wrangler d1 execute allen-newsletter --remote --file=.newsletter/substack-subscribers.sql
```

## Publishing

1. Publish the article on `allenkunle.me` first.
2. In EmailOctopus, create a campaign for either the **Life.doc** or **Tech Notes** segment.
3. Use the article title as the subject, add a short excerpt, and link the button to the full article.
4. Send yourself a test, then send or schedule the campaign.

EmailOctopus requires campaigns to be created in its dashboard. It handles delivery, unsubscribe links, bounce suppression, and campaign reports there. Its self-service subscriber profile page is a paid feature, so the free setup manages topic choices through the site signup form.

## Local development

Copy `.dev.vars.example` to `.dev.vars`, fill in test credentials, build the site, and run it through Wrangler Pages so Functions and D1 bindings are available:

```sh
npm run build
npx wrangler pages dev dist --d1 NEWSLETTER_DB=<database-id>
```
