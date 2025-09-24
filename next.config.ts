import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@remotion/bundler', '@remotion/renderer', 'ffmpeg-static'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
        worker_threads: false,
        module: false,
        'uglify-js': false,
      };
    }
    return config;
  },
};

export default nextConfig;
