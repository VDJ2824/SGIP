import { connectDatabase, disconnectDatabase } from '../src/config/index.js';
import { careerRoleService } from '../src/modules/career-role/service.js';
import { seededCareerRoles } from '../src/modules/career-role/seedData.js';

async function run() {
  await connectDatabase();
  const roles = await careerRoleService.seedDefaults(seededCareerRoles);
  console.log(`Seeded ${roles.length} career roles`);
  await disconnectDatabase();
}

run().catch(async (error) => {
  console.error('Failed to seed career roles', error);
  try {
    await disconnectDatabase();
  } catch {}
  process.exit(1);
});

