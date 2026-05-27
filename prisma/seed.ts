/**
 * Seed script: creates a sample company + admin account for local development.
 *
 * Usage:
 *   npx prisma db push          # sync schema (first time)
 *   npx tsx prisma/seed.ts      # run this seed
 *
 * Credentials created:
 *   Admin email:    admin@example.com
 *   Admin password: password123
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Create company
  const company = await prisma.company.upsert({
    where: { domain: "example.com" },
    update: {},
    create: {
      name: "サンプル株式会社",
      domain: "example.com",
    },
  });
  console.log("✓ Company:", company.name);

  // 2. Create admin user
  const passwordHash = await bcrypt.hash("password123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "管理者 太郎",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
      adminCompanyId: company.id,
    },
  });
  console.log("✓ Admin:", admin.email);

  console.log("\n🎉 Seed complete!");
  console.log("   Login URL: http://localhost:3000/login");
  console.log("   Email:     admin@example.com");
  console.log("   Password:  password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
