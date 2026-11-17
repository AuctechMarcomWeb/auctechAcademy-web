/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // React Compiler: automatically skips re-rendering parts of the page that didn't change (smoother typing,
  // menus and tables). Used for production builds only — it makes `next dev` compile several times slower.
  reactCompiler: process.env.NODE_ENV === "production",
  images: {
    // Thumbnails come from /public (SVG) or the backend's /uploads folder
    // (any host, including localhost), so images are served as-is.
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
