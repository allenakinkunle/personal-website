# allenkunle.me

Allen Akin's personal site, built with Astro and deployed as a static site.

## Development

```sh
npm install
npm run dev
```

Content lives in `src/content/writing`, `src/data`, and `public/photos`. Run `npm run build` before deploying.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22.20 or newer (use the even-numbered LTS release in `.nvmrc`)

Add `allenkunle.me` as the custom domain in Cloudflare Pages after the first deployment.
