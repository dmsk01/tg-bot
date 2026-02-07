import { prisma } from './client.js';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function createSuperAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npx tsx src/database/prisma/create-admin.ts <username> <password>');
    console.error('Example: npx tsx src/database/prisma/create-admin.ts admin SecurePassword123');
    process.exit(1);
  }

  if (username.length < 3) {
    console.error('Username must be at least 3 characters long');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingAdmin) {
      console.error(`Admin with username ${username} already exists`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.adminUser.create({
      data: {
        username: username.toLowerCase(),
        passwordHash,
        role: 'SUPER_ADMIN',
        firstName: 'Super',
        lastName: 'Admin',
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log(`   Username: ${admin.username}`);
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
