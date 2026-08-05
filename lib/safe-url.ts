import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

export async function assertPublicHttpUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (!url || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only public HTTP and HTTPS links are supported.");
  }
  if (url.username || url.password) throw new Error("Links with embedded credentials are not allowed.");
  const directIp = isIP(url.hostname);
  const addresses = directIp
    ? [{ address: url.hostname, family: directIp }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error("The link host could not be resolved.");
  for (const result of addresses) {
    if (
      (result.family === 4 && isPrivateIpv4(result.address)) ||
      (result.family === 6 && isPrivateIpv6(result.address))
    ) {
      throw new Error("Private and local network links are not allowed.");
    }
  }
  return url;
}

export async function fetchPublicMedia(input: string, maximumRedirects = 3): Promise<Response> {
  let current = await assertPublicHttpUrl(input);
  for (let redirect = 0; redirect <= maximumRedirects; redirect += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": "PlantVerseAI/4.0 (+public-media-import)" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("The remote server returned an invalid redirect.");
    current = await assertPublicHttpUrl(new URL(location, current).toString());
  }
  throw new Error("The remote link redirected too many times.");
}
