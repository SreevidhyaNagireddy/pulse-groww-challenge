import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { randomUUID } from "crypto";

export const SESSION_COOKIE_NAME = "pulse_session_id";

/**
 * Gets or creates an anonymous persistent user session.
 * Uses an httpOnly cookie with a 1-year expiration.
 */
export async function getOrCreateSession(): Promise<{ userId: string; sessionId: string }> {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = randomUUID();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // Find or create User in PostgreSQL atomically using upsert
  const user = await prisma.user.upsert({
    where: { sessionId },
    update: {},
    create: {
      sessionId,
      watchlists: {
        create: {
          name: "My Indian Stocks",
        },
      },
    },
  });

  return {
    userId: user.id,
    sessionId: user.sessionId,
  };
}

/**
 * Gets the current watchlist for the active session, creating a default one if none exists.
 */
export async function getOrCreateWatchlist(userId: string) {
  let watchlist = await prisma.watchlist.findFirst({
    where: { userId },
    include: {
      items: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!watchlist) {
    try {
      watchlist = await prisma.watchlist.create({
        data: {
          userId,
          name: "My Indian Stocks",
        },
        include: {
          items: true,
        },
      });
    } catch {
      watchlist = await prisma.watchlist.findFirst({
        where: { userId },
        include: {
          items: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
    }
  }

  return watchlist!;
}
