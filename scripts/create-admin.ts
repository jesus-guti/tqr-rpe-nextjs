// scripts/create-admin.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");

    // Check if admin user already exists
    const existingAdmin = await prisma.users.findUnique({
      where: {
        email: "admin@vimenor.com",
      },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists:");
      console.log(`   📧 Email: ${existingAdmin.email}`);
      console.log(`   👤 Role: ${existingAdmin.role}`);
      console.log(`   🆔 ID: ${existingAdmin.id}`);
      return;
    }

    // Create admin user
    const adminUser = await prisma.users.create({
      data: {
        email: "admin@vimenor.com",
        role: "admin",
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   �� Email: ${adminUser.email}`);
    console.log(`   �� Role: ${adminUser.role}`);
    console.log(`   �� ID: ${adminUser.id}`);
    console.log(`   📅 Created: ${adminUser.created_at}`);

    console.log("\n�� Next steps:");
    console.log("1. Create a Supabase account with this email");
    console.log("2. Set a secure password");
    console.log("3. Use these credentials to log into the admin panel");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
