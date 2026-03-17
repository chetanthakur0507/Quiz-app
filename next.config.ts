import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  distDir: ".next-quiz",
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
