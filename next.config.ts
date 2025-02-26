/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ["res.cloudinary.com", "res.cloudinary.com", "lh3.googleusercontent.com", "avatars.githubusercontent.com", "w7.pngwing.com"],
  },
};

// module.exports = nextConfig;

export default nextConfig
