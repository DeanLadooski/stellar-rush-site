# Stellar Rush Website

This is a static website for Stellar Rush. It can be hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any static web host.

## Pages

- `index.html` - marketing home page
- `leaderboards.html` - public Supabase-powered leaderboards
- `app-ads.txt` - AdMob authorized sellers verification file
- `privacy-policy.html` - App Store Connect privacy policy URL
- `support.html` - App Store Connect support URL

## Before Publishing

Replace these placeholders if needed:

- `support@playstellarrush.com` in `privacy-policy.html` and `support.html`

## Supabase Leaderboards

Run `supabase_migrate_website_leaderboards.sql` in Supabase Dashboard > SQL Editor to create read-only public views for the website. The primary views keep each pilot's top run for the selected ranking, matching the app leaderboards. The page falls back to the existing app tables and dedupes in JavaScript, but the views are the cleaner production path.

## App Store Connect URLs

After hosting, use URLs like:

- Marketing URL / Developer Website URL: `https://playstellarrush.com`
- Privacy Policy URL: `https://your-domain.com/privacy-policy.html`
- Support URL: `https://your-domain.com/support.html`

## AdMob app-ads.txt

AdMob verifies ownership by crawling `https://playstellarrush.com/app-ads.txt`.
After deploying, this URL must return:

```txt
google.com, pub-2412875657887095, DIRECT, f08c47fec0942fa0
```
