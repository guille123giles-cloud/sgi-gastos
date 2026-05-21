import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false, 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Desactivamos Turbopack explícitamente para evitar el conflicto
  webpack: (config) => {
    return config;
  },
};

export default withPWA(nextConfig);