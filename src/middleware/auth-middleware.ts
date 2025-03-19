import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { decode } from "hono/jwt";

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, "access_token");

  if (!token) {
    return c.json({ success: false, error: { message: "Unauthorized" } }, 401);
  }

  try {
    const { payload } = await decode(token);

    c.set("user", payload);

    await next();
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
