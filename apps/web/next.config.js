/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E CI では `next start` を使うため standalone をオフにする（standalone 時は node .next/standalone/server.js が必要）
  ...(process.env.NEXT_E2E_BUILD === '1' ? {} : { output: 'standalone' }),
  // セキュリティヘッダの設定
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: (() => {
              const connectSrc =
                process.env.NEXT_E2E_BUILD === '1'
                  ? "connect-src 'self' https: http://127.0.0.1:9099 http://localhost:9099 ws://127.0.0.1:9099 ws://localhost:9099 http://127.0.0.1:8080 http://localhost:8080"
                  : "connect-src 'self' https:";
              return [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                connectSrc,
                "frame-ancestors 'self'",
              ].join('; ');
            })(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
