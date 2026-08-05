const base = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const paths = ["/login", "/privacy", "/terms", "/shipping", "/refunds", "/api/health"];
let failed = 0;
for (const path of paths) {
  try {
    const response = await fetch(`${base}${path}`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
    const acceptable = path === "/api/health" ? [200, 503].includes(response.status) : response.status >= 200 && response.status < 400;
    console.log(`${acceptable ? "PASS" : "FAIL"} ${response.status} ${path}`);
    if (!acceptable) failed += 1;
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${path}:`, error instanceof Error ? error.message : error);
  }
}
if (failed > 0) process.exitCode = 1;

export {};
