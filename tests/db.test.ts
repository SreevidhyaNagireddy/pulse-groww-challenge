import { prisma } from "../lib/prisma";

async function checkDb() {
  try {
    console.log("Checking DB connection...");
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);
    const watchlistCount = await prisma.watchlist.count();
    console.log("Watchlist count:", watchlistCount);
    const itemCount = await prisma.watchlistItem.count();
    console.log("Watchlist item count:", itemCount);
    const snapshotCount = await prisma.marketSnapshot.count();
    console.log("Snapshot count:", snapshotCount);
    const items = await prisma.watchlistItem.findMany();
    console.log("Items in DB:", items.map(i => ({ symbol: i.symbol, name: i.name, watchlistId: i.watchlistId })));
    const users = await prisma.user.findMany({ include: { watchlists: { include: { items: true } } } });
    console.log("Users in DB:", JSON.stringify(users, null, 2));
  } catch (err: any) {
    console.error("DB connection error:", err.message, err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
