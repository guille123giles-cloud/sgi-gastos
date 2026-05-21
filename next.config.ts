import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esta línea le dice a Next.js que no fuerce Turbopack y use la config estándar
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig);