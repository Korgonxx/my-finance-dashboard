import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.picsum.photos",
      },
      // Allow any https hostname for user-uploaded avatar URLs
      // (covers Firebase Storage, Cloudinary, etc. if added later)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;