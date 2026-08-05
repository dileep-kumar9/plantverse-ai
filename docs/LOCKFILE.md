# Dependency lock file

The generated archive intentionally does not include the older v4 `package-lock.json`, because it did not contain Firebase, Firebase Admin, Playwright or the final v5 dependencies. A stale lock file would make `npm ci` fail or install an incorrect dependency graph.

On a machine with access to the public npm registry, run:

```powershell
npm.cmd install
npm.cmd run verify
npm.cmd run test:e2e:install
npm.cmd run test:e2e
```

Review the generated `package-lock.json`, then commit it before the production deployment. After it is committed, change CI from `npm install` to `npm ci`.
