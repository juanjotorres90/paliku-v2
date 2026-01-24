import nextEnv from "@next/env";
import process from "node:process";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
nextEnv.loadEnvConfig(repoRoot, isDev, console, true);

// Create next-intl plugin pointing to our request config
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/validators", "@repo/i18n"],
};

export default withNextIntl(nextConfig);
