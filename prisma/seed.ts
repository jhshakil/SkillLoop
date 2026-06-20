import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.log("[Seed] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        password: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
        isApproved: true,
      },
    });
    console.log(`[Seed] Super Admin created: ${email}`);
    return;
  }

  const passwordMatches = existing.password
    ? await bcrypt.compare(password, existing.password)
    : false;

  if (passwordMatches && existing.name === name && existing.role === "SUPER_ADMIN") {
    console.log(`[Seed] Super Admin already in sync: ${email}`);
    return;
  }

  const data: Record<string, unknown> = {};
  if (!passwordMatches) data.password = await bcrypt.hash(password, 12);
  if (existing.name !== name) data.name = name;
  if (existing.role !== "SUPER_ADMIN") data.role = "SUPER_ADMIN";
  data.isApproved = true;

  await prisma.user.update({ where: { email }, data });
  console.log(`[Seed] Super Admin updated: ${email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
