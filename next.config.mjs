/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1400, 1920],
  },
};

export default nextConfig;
