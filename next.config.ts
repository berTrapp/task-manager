import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
};
module.exports = {
  allowedDevOrigins: ['192.168.0.170'],
}
export default nextConfig;
