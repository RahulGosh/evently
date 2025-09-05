/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ["res.cloudinary.com", "res.cloudinary.com", "lh3.googleusercontent.com", "avatars.githubusercontent.com", "w7.pngwing.com", "img.clerk.com"],
  },
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    // other env vars needed at build time
  }
};

// module.exports = nextConfig;

export default nextConfig
