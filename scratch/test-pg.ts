import { PrismaClient } from "@prisma/client";

const users = ["postgres", "sreev", "admin", "root"];
const passwords = ["", "postgres", "password", "admin", "root", "123456", "sreev", "Sreev", "groww", "Groww", "pulse", "Pulse", "12345678", "postgres123", "Postgres123"];

async function main() {
  for (const user of users) {
    for (const pw of passwords) {
      const url = `postgresql://${user}:${pw}@localhost:5432/postgres?schema=public`;
      const client = new PrismaClient({ datasources: { db: { url } } });
      try {
        await client.$connect();
        console.log(`MATCH_FOUND! USER: "${user}" PASSWORD: "${pw}"`);
        await client.$disconnect();
        return;
      } catch (e: any) {
        // try next
      }
    }
  }
  console.log("NO_MATCH_FOUND_IN_LIST");
}

main();
