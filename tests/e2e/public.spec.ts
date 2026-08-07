import { expect, test } from "@playwright/test";

test("public homepage, authentication and legal pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /grow with better context using plantverse ai/i })).toBeVisible();

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
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);

  await page.goto("/memory");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("SEO, PWA and health endpoints are available", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const manifestPayload = await manifest.json();
  expect(manifestPayload.name).toBe("PlantVerse AI");
  expect(manifestPayload.start_url).toBe("/");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();

  const serviceWorker = await request.get("/firebase-messaging-sw.js");
  expect(serviceWorker.ok()).toBeTruthy();
  expect(await serviceWorker.text()).toContain("plantverse-shell-v1");

  const health = await request.get("/api/health");
  expect([200, 503]).toContain(health.status());
  const payload = await health.json();
  expect(payload).toHaveProperty("status");
});
