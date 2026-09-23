
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: 'default' } });
  console.log('Current Settings:', JSON.stringify(settings, null, 2));
  await prisma.$disconnect();
}

checkSettings();
