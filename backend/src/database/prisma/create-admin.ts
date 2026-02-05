import { prisma } from './client.js';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function createSuperAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: npx tsx src/database/prisma/create-admin.ts <email> <password>');
    console.error('Example: npx tsx src/database/prisma/create-admin.ts admin@example.com SecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('Invalid email format');
    process.exit(1);
  }

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      console.error(`Admin with email ${email} already exists`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);
    console.log('\n⚠️  Please save the password securely. It cannot be recovered.');
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
