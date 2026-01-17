import { createApp } from "./app";

const app = createApp();

function getPort(): number {
  const raw = process.env.PORT;
  if (!raw) return 3002;

  const port = Number.parseInt(raw, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid PORT environment variable");
  }

  return port;
}

export default {
  port: getPort(),
  fetch: app.fetch,
};
