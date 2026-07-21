const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin is required');
  }
  const email = String(process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_ADMIN_NAME || '').trim();
  if (!email.includes('@') || password.length < 12 || !name) {
    throw new Error('PROVISION_ADMIN_EMAIL, PROVISION_ADMIN_PASSWORD (12+ characters), and PROVISION_ADMIN_NAME are required');
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(JSON.stringify({ event: 'initial_admin_exists', userId: existing.id }));
    return;
  }
  const parts = name.split(/\s+/);
  const firstName = parts.shift();
  const lastName = parts.join(' ') || 'Administrator';
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      firstName,
      lastName,
      role: 'ADMIN',
    },
  });
  console.log(JSON.stringify({ event: 'initial_admin_created', userId: user.id }));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
