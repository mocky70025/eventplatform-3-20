import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "";

// TEMPORARY (design → Figma migration): the Figma MCP capture script is loaded
// from mcp.figma.com and POSTs the serialized page back there, so both
// script-src and connect-src have to allow that host — including in production,
// because the screens being captured are the deployed ones.
// REMOVE once the migration is done; organizer/next.config.ts carries the same line.
const figmaCapture = " https://mcp.figma.com";

const cspDirectives = [
  "default-src 'self'",
  `connect-src 'self' ${supabaseHostname ? `https://${supabaseHostname}` : ""}${figmaCapture}`,
  `img-src 'self' data: blob: ${supabaseHostname ? `https://${supabaseHostname}` : ""}`,
  `script-src 'self' 'unsafe-inline'${figmaCapture}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
