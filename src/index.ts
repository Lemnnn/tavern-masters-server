import { serve } from "@hono/node-server";
import { createClient } from "@supabase/supabase-js";
import { Hono } from "hono";
import "dotenv/config";
import auth from "./routes/auth/auth.js";
import { cors } from "hono/cors";
import blizzard from "./routes/blizzard/blizzard.js";
import comps from "./routes/comps/comps.js";

const app = new Hono();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

app.use(
  "/api/*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

serve({
  fetch: app.fetch,
  port: 8080,
});

app.route("/api/v1", auth);
app.route("/api/v1", blizzard);
app.route("/api/v1", comps);

app.get("/healthcheck", (c) => {
  return c.json({ status: "ok" }, 200);
});
