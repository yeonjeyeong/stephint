import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname 
          : '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/submission-images/**',
      },
    ],
  },
};

export default nextConfig;
