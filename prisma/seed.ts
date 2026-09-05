import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Preparing Ashtavakra Gym database for Production...');

  // 1. Delete Demo Data (Sample Members, Sample Bookings, Sample Attendance, Sample Announcements)
  await prisma.attendance.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.announcement.deleteMany({});

  // Delete sample non-admin members
  await prisma.user.deleteMany({
    where: {
      role: 'MEMBER',
    },
  });

  console.log('✅ Removed all demo member accounts, sample bookings, and test logs.');

  // 2. Create or Update Production Gym Settings
  await prisma.gymSettings.upsert({
    where: { id: 'default' },
    update: {
      defaultCapacity: 25,
      allowedDomains: 'somaiya.edu',
    },
    create: {
      id: 'default',
      morningStart: '06:00',
      morningEnd: '09:00',
      eveningStart: '16:00',
      eveningEnd: '21:00',
      slotDurationMinutes: 90,
      slotIntervalMinutes: 0,
      defaultCapacity: 25, // Fixed 25 members capacity
      maxBookingsPerDay: 1,
      cancellationDeadlineMinutes: 30,
      waitlistEnabled: true,
      allowedDomains: 'somaiya.edu',
    },
  });

  // 3. Create / Update Primary System Administrator
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Somaiya2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@somaiya.edu' },
    update: { passwordHash: adminPasswordHash },
    create: {
      memberId: 'ADM001',
      name: 'Ashtavakra Gym Administrator',
      email: 'admin@somaiya.edu',
      phone: '9876500000',
      bloodGroup: 'O+',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log(`✅ System Admin configured: ${admin.email}`);

  // 4. Generate Initial Operating Slots (Mon-Sat, 06:00-09:00 & 16:00-21:00, Capacity 25)
  const today = new Date();
  const slotDefinitions = [
    // Morning Slots (06:00 - 09:00)
    { startTime: '06:00', endTime: '07:30', period: 'MORNING' },
    { startTime: '07:30', endTime: '09:00', period: 'MORNING' },
    // Evening Slots (16:00 - 21:00)
    { startTime: '16:00', endTime: '17:30', period: 'EVENING' },
    { startTime: '17:30', endTime: '19:00', period: 'EVENING' },
    { startTime: '19:00', endTime: '20:30', period: 'EVENING' },
  ];

  let slotsCreatedCount = 0;
  for (let i = 0; i < 14; i++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() + i);

    // Skip Sundays (0 = Sunday)
    if (dateObj.getDay() === 0) continue;

    const dateStr = dateObj.toISOString().split('T')[0];

    for (const def of slotDefinitions) {
      await prisma.slot.upsert({
        where: {
          date_startTime_endTime: {
            date: dateStr,
            startTime: def.startTime,
            endTime: def.endTime,
          },
        },
        update: { capacity: 25, status: 'ACTIVE' },
        create: {
          date: dateStr,
          startTime: def.startTime,
          endTime: def.endTime,
          period: def.period,
          capacity: 25,
          status: 'ACTIVE',
        },
      });
      slotsCreatedCount++;
    }
  }

  console.log(`✅ Generated ${slotsCreatedCount} operating slots for Monday–Saturday over the next 2 weeks.`);

  // 5. Create Official Welcome Announcement
  await prisma.announcement.upsert({
    where: { id: 'official-announcement-1' },
    update: {},
    create: {
      id: 'official-announcement-1',
      title: 'Welcome to Ashtavakra Hostel Gym',
      content: 'Gym operating days are Monday to Saturday. Session slots are capped at 25 members. Please log in using your official @somaiya.edu Google account to book your daily slot.',
      priority: 'HIGH',
      startDate: new Date(),
      endDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      createdBy: admin.id,
    },
  });

  console.log('🎉 Production database setup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Database setup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
