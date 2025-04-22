import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth-middleware.js";

const blizzard = new Hono().basePath("/blizzard");

async function getAccessToken() {
  const response = await fetch(process.env.TOKEN_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.CLIENT_ID as string,
      client_secret: process.env.CLIENT_SECRET as string,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch access token");
  }

  const data = await response.json();

  return data.access_token;
}

async function fetchCards(
  cardType: "minion" | "hero" | "spell",
  tier = "",
  minionType = ""
) {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    locale: "en_US",
    gameMode: "battlegrounds",
    sort: "tier:asc",
    pageSize: "24",
    bgCardType: cardType,
  });

  if (tier === "0") {
    tier.split(",").forEach((t) => params.append("tier", t));
  } else if (tier) {
    params.append("tier", tier);
  }

  if (minionType && minionType !== "All") {
    params.append("minionType", minionType.toLowerCase());
  }

  const res = await fetch(
    `${process.env.BLIZZARD_BASE_API_URL}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Failed to fetch cards");
  }

  return res.json();
}

blizzard.get("/cards/common", authMiddleware, async (c) => {
  const { tier, type } = c.req.query();

  const data = await fetchCards("minion", tier, type);

  return c.json({ success: true, data });
});

blizzard.get("/cards/hero", authMiddleware, async (c) => {
  const data = await fetchCards("hero");

  return c.json({ success: true, data });
});

blizzard.get("/cards/spell", authMiddleware, async (c) => {
  const { tier } = c.req.query();

  const data = await fetchCards("spell", tier);

  return c.json({ success: true, data });
});

export default blizzard;
