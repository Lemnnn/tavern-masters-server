import { serve } from "@hono/node-server";
import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import "dotenv/config";
import auth from "./routes/auth/auth.js";

const app = new Hono();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

serve({
  fetch: app.fetch,
  port: 8080,
});

app.route("/api/v1", auth);

app.get("/healthcheck", (c) => {
  return c.json({ status: "ok" }, 200);
});
