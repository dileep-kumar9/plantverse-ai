# PlantVerse AI Architecture

- **Next.js App Router** for pages and server API routes.
- **Gemini multimodal API** through `app/api/analyze/route.ts`; API keys are server-only.
- **Local-first Plant Memory** in browser storage for the integrated build. Replace `lib/local-store.ts` with Firestore adapters for multi-device sync.
- **Device adapters** support universal manual readings; direct Bluetooth requires per-device protocols and browser support.
- **Commerce adapters** separate catalogue UI from payment, inventory, tax, and courier providers.
- **Translation UI** supports original/translated, line-by-line display. Production free-form translation needs a configured AI/translation endpoint.
