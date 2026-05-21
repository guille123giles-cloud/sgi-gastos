import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Acá podés dejar otras configuraciones si tenías alguna, si no, dejalo así.
};

export default withPWA(nextConfig);