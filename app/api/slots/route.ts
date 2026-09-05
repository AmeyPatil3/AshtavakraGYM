import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Check if the requested date is Sunday (0)
    const dateObj = new Date(dateParam + 'T00:00:00');
    const isSunday = dateObj.getDay() === 0;

    if (isSunday) {
      return NextResponse.json({
        date: dateParam,
        isClosed: true,
        message: 'The Ashtavakra Hostel Gym is CLOSED on Sundays. Operating days: Monday to Saturday.',
        slots: [],
      });
    }

    // Fetch Gym Settings
    const settings = await prisma.gymSettings.findUnique({ where: { id: 'default' } });
    const capacity = settings?.defaultCapacity || 25; // Default 25 capacity

    // Standard slot definitions if date has no slots generated yet
    const defaultSlotDefs = [
      { startTime: '06:00', endTime: '07:30', period: 'MORNING' },
      { startTime: '07:30', endTime: '09:00', period: 'MORNING' },
      { startTime: '16:00', endTime: '17:30', period: 'EVENING' },
      { startTime: '17:30', endTime: '19:00', period: 'EVENING' },
      { startTime: '19:00', endTime: '20:30', period: 'EVENING' },
    ];

    // Check if slots exist for this date
    let slots = await prisma.slot.findMany({
      where: { date: dateParam, status: 'ACTIVE' },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
          select: { id: true, userId: true },
        },
        waitlists: {
          where: { status: 'WAITING' },
          select: { id: true, userId: true },
        },
      },
      orderBy: [{ startTime: 'asc' }],
    });

    // Auto-generate if empty
    if (slots.length === 0) {
      await prisma.$transaction(
        defaultSlotDefs.map((def) =>
          prisma.slot.upsert({
            where: {
              date_startTime_endTime: {
                date: dateParam,
                startTime: def.startTime,
                endTime: def.endTime,
              },
            },
            update: { capacity },
            create: {
              date: dateParam,
              startTime: def.startTime,
              endTime: def.endTime,
              period: def.period,
              capacity,
              status: 'ACTIVE',
            },
          })
        )
      );

      slots = await prisma.slot.findMany({
        where: { date: dateParam, status: 'ACTIVE' },
        include: {
          bookings: {
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            select: { id: true, userId: true },
          },
          waitlists: {
            where: { status: 'WAITING' },
            select: { id: true, userId: true },
          },
        },
        orderBy: [{ startTime: 'asc' }],
      });
    }

    const session = await getCurrentUser();
    const now = new Date();

    // Map slots with exact vacancy counts and expiration status
    const slotsWithVacancies = slots.map((slot) => {
      const bookedCount = slot.bookings.length;
      const vacancies = Math.max(0, slot.capacity - bookedCount);
      const isFull = vacancies === 0;
      const userBooking = session ? slot.bookings.find((b) => b.userId === session.userId) : null;
      const userWaitlist = session ? slot.waitlists.find((w) => w.userId === session.userId) : null;

      // Slot is expired if its date & end time has passed (enforced in IST UTC+5:30)
      const slotEndTime = new Date(`${slot.date}T${slot.endTime}:00+05:30`);
      const isExpired = now > slotEndTime;

      return {
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        period: slot.period,
        capacity: slot.capacity, // 25
        bookedCount,
        vacancies, // E.g. 23 spots available
        isFull,
        isExpired, // true if session time ended
        userBookingId: userBooking?.id || null,
        isUserBooked: !!userBooking,
        isUserWaitlisted: !!userWaitlist,
        waitlistCount: slot.waitlists.length,
      };
    });

    return NextResponse.json({
      date: dateParam,
      slots: slotsWithVacancies,
    });
  } catch (error: any) {
    console.error('Fetch slots error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch slots' }, { status: 500 });
  }
}
