/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),/*
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self' 'unsafe-eval' https://*.gloomy-store.com; img-src 'self' https://*.gloomy-store.com; style-src 'self' 'unsafe-inline';"
              : "default-src 'self' https://*.gloomy-store.com; img-src 'self' https://*.gloomy-store.com; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },*/
};

export default nextConfig;