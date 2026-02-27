# Proven AI

Your calm, structured path to understanding and using AI effectively.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Cloudflare Pages Functions (Workers)
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** Better Auth
- **Hosting:** Cloudflare Pages — provenai.app

## Development

```sh
npm install
npm run dev
```

## Deployment

```sh
npx vite build
npx wrangler pages deploy dist --project-name=proven-ai
```

## Integration Docs

- Affiliate + Stripe integration: [AFFILIATE_STRIPE_INTEGRATION_FLOW.md](AFFILIATE_STRIPE_INTEGRATION_FLOW.md)
