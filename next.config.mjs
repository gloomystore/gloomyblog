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
      //       value: "default-src 'self' https://blog.gloomy-store.com; script-src 'self' 'unsafe-eval' https://blog.gloomy-store.com; style-src 'self' 'unsafe-inline' https://blog.gloomy-store.com;",
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