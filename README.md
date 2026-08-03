# PlantVerse AI

Integrated Next.js application for plant, soil and land analysis, plant memory, translation, device compatibility, moisture readings, planning, marketplace and AI assistance.

## Run

```powershell
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```

Add `GEMINI_API_KEY` to `.env.local` and Vercel Environment Variables. Never commit `.env.local`.

## Included

- Gemini image analysis with structured reports
- Camera/gallery upload and preview
- Save reports to Plant Memory
- Print or save reports as PDF
- Plant profiles and health views
- Pot, terrace, field and empty-land planner
- Plant-name and line-by-line translator UI
- Universal moisture-meter manual input and compatibility catalogue
- Marketplace, cart UI and delivery-tracking workflow
- AI assistant interface and global responsive navigation
- Light/dark theme and mobile layouts

## External integrations

Firebase, live payments, couriers, weather, vendor Bluetooth protocols and production translation providers require separate credentials and agreements. See `docs/INTEGRATIONS.md`.
