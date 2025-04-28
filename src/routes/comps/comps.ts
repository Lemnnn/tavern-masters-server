import { Hono } from "hono";
import { supabase } from "../../index.js";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import { zValidator } from "@hono/zod-validator";
import type { TUser } from "../../schemas/user.schema.js";
import { compSchema } from "../../schemas/comp.schema.js";

type Variables = {
  user: TUser;
};

const comps = new Hono<{ Variables: Variables }>().basePath("/comps");

comps.post(
  "/create",
  authMiddleware,
  zValidator(
    "json",
    compSchema.omit({ id: true, created_at: true, created_by: true })
  ),
  async (c) => {
    try {
      const body = await c.req.json();
      const user = c.get("user");

      const { error } = await supabase.from("comps").insert({
        ...body,
        created_by: user.id,
      });

      if (error) {
        console.error(error);
        return c.json(
          { success: false, error: { message: "Failed to create comp" } },
          500
        );
      }

      return c.json(
        { success: true, message: "Comp created successfully!" },
        201
      );
    } catch (error) {
      if (!(error instanceof Error)) {
        return c.json(
          { success: false, error: { message: "Internal server error!" } },
          500
        );
      }

      return c.json({ success: false, error: { message: error.message } }, 500);
    }
  }
);

export default comps;
