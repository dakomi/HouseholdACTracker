import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create zones
  const livingRoom = await prisma.zone.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Living Room', kwh_per_hour: 1.5 },
  });

  const masterBedroom = await prisma.zone.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Master Bedroom', kwh_per_hour: 1.2 },
  });

  const bedroom2 = await prisma.zone.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Bedroom 2', kwh_per_hour: 1.0 },
  });

  const diningRoom = await prisma.zone.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'Dining Room', kwh_per_hour: 1.3 },
  });

  console.log('Zones created:', livingRoom.name, masterBedroom.name, bedroom2.name, diningRoom.name);

  // Create zone combination: Living Room + Dining Room = 4.0 kWh
  const combo = await prisma.zoneCombination.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      label: 'Living + Dining',
      kwh_per_hour: 4.0,
      zones: {
        create: [
          { zone_id: livingRoom.id },
          { zone_id: diningRoom.id },
        ],
      },
    },
  });

  console.log('Zone combination created:', combo.label);

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Alice', colour: '#FF6B6B', is_admin: true },
    }),
    prisma.user.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'Bob', colour: '#4ECDC4' },
    }),
    prisma.user.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: 'Carol', colour: '#45B7D1' },
    }),
    prisma.user.upsert({
      where: { id: 4 },
      update: {},
      create: { id: 4, name: 'Dave', colour: '#96CEB4' },
    }),
    prisma.user.upsert({
      where: { id: 5 },
      update: {},
      create: { id: 5, name: 'Eve', colour: '#FFEAA7' },
    }),
  ]);

  console.log('Users created:', users.map((u) => u.name).join(', '));

  // Create settings singleton
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      electricity_rate: 0.25,
      auto_off_duration: 120,
      household_name: 'Our Home',
      require_confirmation: true,
    },
  });

  console.log('Settings created:', settings.household_name);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
