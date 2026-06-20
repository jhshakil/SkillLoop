import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function seedSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!superAdminEmail || !superAdminPassword) {
    console.log("[Seed] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env — skipping.");
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
      await prisma.user.create({
        data: {
          email: superAdminEmail,
          name: superAdminName,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          isApproved: true,
        },
      });
      console.log(`[Seed] Super Admin created: ${superAdminEmail}`);
      return;
    }

    // Compare existing password with env credentials
    const passwordMatches = existing.password
      ? await bcrypt.compare(superAdminPassword, existing.password)
      : false;

    const nameChanged = existing.name !== superAdminName;
    const roleChanged = existing.role !== "SUPER_ADMIN";
    const needsUpdate = !passwordMatches || nameChanged || roleChanged;

    if (!needsUpdate) {
      console.log(`[Seed] Super Admin already in sync: ${superAdminEmail}`);
      return;
    }

    const data: Record<string, unknown> = {};
    if (!passwordMatches) data.password = await bcrypt.hash(superAdminPassword, 12);
    if (nameChanged) data.name = superAdminName;
    if (roleChanged) data.role = "SUPER_ADMIN";
    data.isApproved = true;

    await prisma.user.update({
      where: { email: superAdminEmail },
      data,
    });

    const changes: string[] = [];
    if (!passwordMatches) changes.push("password");
    if (nameChanged) changes.push("name");
    if (roleChanged) changes.push("role");
    console.log(`[Seed] Super Admin updated (${changes.join(", ")}): ${superAdminEmail}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("P2021")) {
      console.log("[Seed] Database tables not found. Run 'pnpm db:push' first.");
    } else {
      console.error("[Seed] Failed:", message);
    }
  }
}
