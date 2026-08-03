# Production integrations

1. `GEMINI_API_KEY` in `.env.local` and Vercel Environment Variables.
2. Firebase Authentication, Firestore and Storage for accounts, Plant Memory and media.
3. Payment provider and merchant account for checkout and billing.
4. Courier or fulfilment API for live tracking.
5. Weather API and user location consent for live forecasts.
6. Vendor protocol documentation for each Bluetooth sensor model.

The app runs without these integrations using local persistence and clearly marked interface adapters.
