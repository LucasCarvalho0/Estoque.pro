import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: {
      matricula: true,
      nome: true,
      role: true,
      ativo: true
    }
  });
  console.log("Usuários no sistema:");
  console.table(users);
}
main().finally(() => prisma.$disconnect());
