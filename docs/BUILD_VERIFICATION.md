# Archive verification record

## Completed while assembling this archive

- Source trees from the latest working PlantVerse project and production foundation were merged without `.env.local`, service-account JSON, `.git`, `.next` or `node_modules`.
- JSON configuration files were parsed.
- TypeScript/TSX parser-level syntax checks were run with the available global TypeScript compiler.
- Obsolete authentication module references and obvious credential patterns were searched.
- The project includes release tests, strict provider acceptance, a secret scanner and CI configuration.

## Not certified in the assembly environment

The assembly environment could not reach the npm registry reliably and contained no project `node_modules`. Therefore it was not possible to truthfully certify:

- `npm install` or a final `package-lock.json`
- dependency-backed ESLint and full TypeScript resolution
- `next build`
- unit or Playwright execution
- live Firebase, Gemini, Upstash, Stripe, Shiprocket, FCM, analytics, monitoring or backup calls

## Required verification on the developer machine

```powershell
npm.cmd install
npm.cmd run check:secrets
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run build
npm.cmd run test:e2e:install
npm.cmd run test:e2e
$env:EXTERNAL_ACCEPTANCE_STRICT="true"
npm.cmd run test:external
```

Deploy first to a Vercel Preview environment, run the smoke test and complete `RELEASE_CHECKLIST.md`. Do not enable commerce or indexing before all required checks pass.
