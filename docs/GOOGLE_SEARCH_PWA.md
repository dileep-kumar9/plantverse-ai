# Google Search + free installable web app release

PlantVerse has two free public distribution surfaces:

1. The production website at `https://plantverse-ai.vercel.app`.
2. An installable Progressive Web App (PWA) from supported browsers.

A public Google Play Store listing is a separate distribution channel and requires Google's developer registration fee for full distribution.

## Production environment

Set these in Vercel Production:

```text
NEXT_PUBLIC_APP_URL=https://plantverse-ai.vercel.app
ALLOW_INDEXING=true
GOOGLE_SITE_VERIFICATION=<value from Google Search Console>
```

`ALLOW_INDEXING` is optional on Vercel production because production is indexable by default unless it is explicitly set to `false`. Keep Preview deployments non-indexable.

## Verify before requesting indexing

After production deployment, open these URLs in a signed-out/private browser window:

```text
https://plantverse-ai.vercel.app/
https://plantverse-ai.vercel.app/robots.txt
https://plantverse-ai.vercel.app/sitemap.xml
https://plantverse-ai.vercel.app/manifest.webmanifest
https://plantverse-ai.vercel.app/firebase-messaging-sw.js
https://plantverse-ai.vercel.app/offline
```

The homepage, robots file and sitemap must not redirect to `/login`.

## Google Search Console

1. Add the URL-prefix property `https://plantverse-ai.vercel.app/`.
2. Choose HTML tag verification and copy only the verification token into `GOOGLE_SITE_VERIFICATION`.
3. Redeploy production and verify the property.
4. Submit `sitemap.xml` in the Sitemaps report.
5. Use URL Inspection for the homepage and request indexing.

Indexing is decided by Google and can take time; submission does not guarantee ranking.

## PWA install test

On Android Chrome or desktop Chrome/Edge, open the production homepage and use the install control or the browser's Install app command. On iPhone/iPad Safari, use Share → Add to Home Screen.

The service worker provides a basic offline fallback. AI analysis, authentication, cloud records and live data still require a network connection.
