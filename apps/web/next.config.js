import nextEnv from "@next/env";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
nextEnv.loadEnvConfig(repoRoot, isDev, console, true);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/validators"],
};

export default nextConfig;
