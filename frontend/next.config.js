/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output: a self-contained server bundle for a lean production
  // image (see frontend/Dockerfile.prod). No effect on `next dev`.
  output: "standalone",
  images: {
    // Next's built-in optimizer proxies through the Node server, which in the
    // Docker/local setup can't resolve "localhost:8000" back to the backend
    // container. Django serves media directly, so let the browser fetch it.
    unoptimized: true,
  },
};

module.exports = nextConfig;
