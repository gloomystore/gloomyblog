/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
  async headers() {
    return [
      // {
      //   source: '/(.*)',
      //   headers: [
      //     {
      //       key: 'Content-Security-Policy',
      //       value: "default-src 'self' https://blog.gloomy-store.com; script-src 'self' 'unsafe-eval' https://blog.gloomy-store.com; style-src 'self' 'unsafe-inline' https://blog.gloomy-store.com;",
      //     },
      //   ],
      // },
    ];
  },
};

export default nextConfig;