import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const scriptSource = [
  "script-src 'self' 'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : "",
  "https://accounts.google.com",
  "https://apis.google.com",
  "https://www.gstatic.com",
  "https://www.googletagmanager.com",
]
  .filter(Boolean)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://checkout.stripe.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  scriptSource,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  [
    "connect-src 'self'",
    "https://accounts.google.com",
    "https://apis.google.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://fcmregistrations.googleapis.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://*.ingest.sentry.io",
  ].join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  isProduction ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), microphone=(self), geolocation=(self), payment=(self), serial=(self), bluetooth=(self), usb=()",
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
