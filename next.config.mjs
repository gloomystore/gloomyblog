/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  async headers() {
    return [
      // {
      //   source: '/(.*)',
      //   headers: [
      //     {
      //       key: 'Content-Security-Policy',
      //       value: "default-src 'self' https://www.gloomy-store.com; script-src 'self' 'unsafe-eval' https://www.gloomy-store.com; style-src 'self' 'unsafe-inline' https://www.gloomy-store.com;",
      //     },
      //   ],
      // },
    ];
  },
};

if (process.env.NODE_ENV === 'production') {
  nextConfig.compiler = {
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  };
}

export default nextConfig;