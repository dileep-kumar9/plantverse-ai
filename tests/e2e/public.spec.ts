import { expect, test } from "@playwright/test";

test("public authentication and legal pages render", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /sign in to plantverse/i })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
  await page.goto("/shipping");
  await expect(page.getByRole("heading", { name: "Shipping Policy" })).toBeVisible();
});

test("protected pages redirect unauthenticated users", async ({ page }) => {
  await page.goto("/memory");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("manifest and health endpoint are available", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const health = await request.get("/api/health");
  expect([200, 503]).toContain(health.status());
  const payload = await health.json();
  expect(payload).toHaveProperty("status");
});
