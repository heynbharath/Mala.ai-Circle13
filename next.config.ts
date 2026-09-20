import type { NextConfig } from "next";
import nextPWA from "@ducanh2912/next-pwa";

const withPWA = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
