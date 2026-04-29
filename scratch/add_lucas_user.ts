import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("116221", 10);
  
  const user = await prisma.user.upsert({
    where: { matricula: "116221" },
    update: {
      nome: "Lucas Carvalho",
      senha: hash,
      role: UserRole.ADMINISTRADOR
    },
    create: {
      matricula: "116221",
      nome: "Lucas Carvalho",
      email: "lucas@vpc.com",
      senha: hash,
      role: UserRole.ADMINISTRADOR
    },
  });

  console.log(`✅ Usuário ${user.nome} (Matrícula: ${user.matricula}) criado/atualizado com sucesso!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
