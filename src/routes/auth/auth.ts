import { Hono } from "hono";
import type { TUser } from "../../schemas/user.schema.js";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../../schemas/auth.schema.js";
import { supabase } from "../../index.js";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import bcrypt from "bcrypt";
import { authMiddleware } from "../../middleware/auth-middleware.js";

type Variables = {
  user: TUser;
};

const auth = new Hono<{ Variables: Variables }>().basePath("/auth");

const JWT_SECRET = process.env.JWT_SECRET as string;

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  try {
    const { username, email, password } = await c.req.json();

    const { data: userExists, error: userExistsError } = await supabase
      .from("users")
      .select()
      .eq("email", email);

    if (userExistsError) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    if (userExists.length > 0) {
      return c.json(
        { success: false, error: { message: "User already exists" } },
        400
      );
    }

    const bcryptHash = await bcrypt.hash(password, 14);

    const { data: insertedUser, error: insertedUserError } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password: bcryptHash,
        },
      ])
      .select("id, username, email, created_at")
      .single();

    if (insertedUserError) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    const tokenPayload = {
      id: insertedUser.id,
      username: insertedUser.username,
      email: insertedUser.email,
      created_at: insertedUser.created_at,
    };

    const signedToken = await sign(tokenPayload, JWT_SECRET);

    setCookie(c, "access_token", signedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "localhost",
    });

    return c.json(
      { success: true, mesage: "User registered successfully!" },
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
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = await c.req.json();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select()
      .eq("email", email)
      .single();

    if (userError) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    if (!user) {
      return c.json(
        { success: false, error: { message: "Invalid credentials!" } },
        404
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return c.json(
        { success: false, error: { message: "Invalid password!" } },
        404
      );
    }

    delete user.password;

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    const signedToken = await sign(tokenPayload, JWT_SECRET);

    setCookie(c, "access_token", signedToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "localhost",
    });

    return c.json({ success: true, message: "Logged in successfully!" }, 200);
  } catch (error) {
    if (!(error instanceof Error)) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    return c.json({ success: false, error: { message: error.message } }, 500);
  }
});

auth.get("/me", authMiddleware, async (c) => {
  try {
    const payload = c.get("user");

    if (!payload) {
      return c.json(
        { success: false, error: { message: "Unauthorized!" } },
        401
      );
    }

    return c.json({ success: true, data: { user: payload } }, 200);
  } catch (error) {
    if (!(error instanceof Error)) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    return c.json({ success: false, error: { message: error.message } }, 500);
  }
});

auth.post("/logout", authMiddleware, async (c) => {
  try {
    setCookie(c, "access_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: "localhost",
      maxAge: 0,
    });

    return c.json({ success: true, message: "Logged out successfully!" }, 200);
  } catch (error) {
    if (!(error instanceof Error)) {
      return c.json(
        { success: false, error: { message: "Internal server error!" } },
        500
      );
    }

    return c.json({ success: false, error: { message: error.message } }, 500);
  }
});

export default auth;
