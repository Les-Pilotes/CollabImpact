import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const immersions = await prisma.event.findMany();
  const users = await prisma.user.findMany();
  console.log();
  console.log();
  if (users.length > 0) {
    console.log();
  }
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
