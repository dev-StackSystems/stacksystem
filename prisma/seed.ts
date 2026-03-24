import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@stacksystems.com.br" },
  })

  if (existing) {
    console.log("Seed: admin já existe, pulando.")
    return
  }

  const hashedPassword = await bcrypt.hash("Admin@1234!", 12)

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@stacksystems.com.br",
      password: hashedPassword,
      role: UserRole.A,
      department: "TI",
      active: true,
    },
  })

  console.log(`Seed: admin criado — ${admin.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
