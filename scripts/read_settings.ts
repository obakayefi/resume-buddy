import { prisma } from '../src/lib/db.ts';

async function main() {
  const s = await prisma.settings.findUnique({ where: { id: 'default' } });
  console.log('SETTINGS_RESULT:', JSON.stringify(s, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
