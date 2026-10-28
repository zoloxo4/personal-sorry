# Cinematic Apology Website + Private Visit Dashboard

A responsive, dark romantic apology website built with Next.js, Tailwind CSS, Framer Motion, and Supabase. Includes a private admin dashboard with coarse device category, approximate visit duration, and page events.

## Features

- Cinematic dark rose theme, floating petals, scroll reveals, animated heart, responsive memory cards, apology letter, surprise interaction.
- Background music player. Add your own licensed/permissioned audio file as `public/song.mp3`. Music starts only after the visitor taps Play.
- Privacy-friendly analytics: session-scoped random ID, approximate mobile/tablet/desktop category, visit duration and named page events.
- Private `/admin` dashboard: email/password sign-in, server-side admin email allowlist, recent visits, duration, device counts, event timeline.
- No phone number collection, no precise GPS, no fingerprinting, no third-party analytics scripts.
- Supabase service-role key stays on the server.

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- A Supabase project
- npm

## 1. Install

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase project URL, anon key, service-role key, and the admin email address. Do not commit `.env.local` or share the service-role key.

## 2. Configure Supabase

1. Create a project at https://supabase.com.
2. Open **Project Settings → API** and copy the project URL, anon/public key, and service-role key into `.env.local`.
3. Open **SQL Editor**, paste `supabase/schema.sql`, and run it.
4. In **Authentication → Providers**, ensure Email is enabled.
5. In **Authentication → Users**, create an admin user with an email/password you control. If email confirmation is enabled, confirm the account.
6. Set `ADMIN_EMAILS` to the exact admin email in `.env.local`.
7. Restart the dev server after changing environment variables.

The service-role key bypasses RLS, so keep it server-only. The tables have RLS enabled and no browser-accessible policies.

## 3. Personalize the page

Set `NEXT_PUBLIC_LOVED_ONE_NAME` and `NEXT_PUBLIC_YOUR_NAME` in `.env.local`.

Add an audio file you have permission to use at `public/song.mp3`. You can create the `public` folder if it doesn't exist. The website won't play a song until the visitor taps **Play our song**; modern browsers generally block audio autoplay before user interaction.

Replace the sample memory cards in `app/page.tsx` with your own respectful messages. To add photos, place files in `public/` and use ordinary image elements or Next.js Image. Only use photos you have permission to share.

## 4. Run locally

```bash
npm run dev
```

Open:
- Public page: http://localhost:3000
- Private dashboard: http://localhost:3000/admin

Test analytics by opening the public page in a second tab, scrolling, starting the music, and clicking the interaction button. The dashboard can take a few seconds to reflect heartbeats.

## 5. Build for production

```bash
npm run build
npm start
```

Deploy to Vercel or another Node-compatible host. Add the same environment variables in the host's project settings. Never place `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable.

## Analytics details and limits

- One random session ID is stored in `sessionStorage`; it is not a phone/device identity and is discarded with that browser tab session.
- Device category is inferred approximately from the browser's user-agent string.
- Duration is estimated from page-open time and periodic visible-tab heartbeats. Browser shutdowns, network loss, and background throttling can make it inaccurate.
- “May be active” is only a best-effort label, not proof a person is currently viewing.
- IP addresses, exact location, contacts, phone numbers, and device fingerprints are not deliberately collected by this app.
- Anyone can open a public website without identifying themselves. Analytics cannot prove that a specific person visited.
- Consider adding a brief privacy notice before collecting analytics and delete old visit records periodically. Avoid using visit data to pressure someone to respond.

## Troubleshooting

- **Analytics not configured**: confirm `.env.local` values and restart Next.js.
- **Admin gets 403**: ensure the signed-in email exactly matches one of `ADMIN_EMAILS`.
- **Admin sign-in fails**: create the user in Supabase Auth and check email confirmation/provider settings.
- **No song**: add `public/song.mp3`; ensure the format is browser-compatible.
- **Supabase errors**: verify the SQL schema was run in the correct project and that the server-only service role key is valid.
