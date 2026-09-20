/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Cloudflare Pages serves the exported files without a Next.js image server.
  images: { unoptimized: true },
};

export default nextConfig;
