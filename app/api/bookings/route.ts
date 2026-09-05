import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const MAX_WAITLIST_PER_SLOT = 5;

// POST: Book a slot or join waitlist
export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { slotId } = await req.json();
    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    // Fetch Target Slot
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        },
        waitlists: {
          where: { status: 'WAITING' },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!slot || slot.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Slot not found or inactive' }, { status: 404 });
    }

    // Check if slot date is Sunday
    const slotDateObj = new Date(slot.date + 'T00:00:00');
    if (slotDateObj.getDay() === 0) {
      return NextResponse.json({ error: 'The gym is CLOSED on Sundays (Operating days: Mon–Sat).' }, { status: 400 });
    }

    // Check if slot time has already expired
    const now = new Date();
    const slotEndTime = new Date(`${slot.date}T${slot.endTime}:00`);
    if (now > slotEndTime) {
      return NextResponse.json(
        { error: `This workout slot (${slot.date} ${slot.startTime}–${slot.endTime}) has already ended and can no longer be booked.` },
        { status: 400 }
      );
    }

    // Check if user is already booked for this specific slot
    const existingSlotBooking = await prisma.booking.findFirst({
      where: {
        userId: session.userId,
        slotId: slot.id,
        status: 'CONFIRMED',
      },
    });

    if (existingSlotBooking) {
      return NextResponse.json({ error: 'You are already registered for this slot.' }, { status: 400 });
    }

    const currentBooked = slot.bookings.length;
    const isFull = currentBooked >= slot.capacity;

    if (isFull) {
      // Slot is full -> Handle Waitlist (Up to 5 members per slot)
      if (slot.waitlists.length >= MAX_WAITLIST_PER_SLOT) {
        return NextResponse.json(
          { error: `This slot is full and the waitlist has reached its maximum limit of ${MAX_WAITLIST_PER_SLOT} members.` },
          { status: 400 }
        );
      }

      // Check if user is already on the waitlist for this slot
      const existingWaitlist = await prisma.waitlist.findFirst({
        where: { userId: session.userId, slotId: slot.id, status: 'WAITING' },
      });

      if (existingWaitlist) {
        return NextResponse.json(
          { error: `You are already on the waitlist for this slot at position #${existingWaitlist.position}.` },
          { status: 400 }
        );
      }

      const nextPosition = slot.waitlists.length + 1;
      await prisma.waitlist.create({
        data: {
          userId: session.userId,
          slotId: slot.id,
          position: nextPosition,
          status: 'WAITING',
        },
      });

      return NextResponse.json({
        message: `Slot is full (${slot.capacity}/${slot.capacity}). You have joined the waitlist at position #${nextPosition} (of ${MAX_WAITLIST_PER_SLOT}).`,
        status: 'WAITLISTED',
        waitlistPosition: nextPosition,
      });
    }

    // Slot Has Vacancy -> Check if user already booked a slot on the same date
    const existingDateBooking = await prisma.booking.findFirst({
      where: {
        userId: session.userId,
        status: 'CONFIRMED',
        slot: { date: slot.date },
      },
    });

    if (existingDateBooking) {
      return NextResponse.json(
        { error: `You already have a confirmed booking for ${slot.date}. Maximum 1 confirmed booking per day allowed.` },
        { status: 400 }
      );
    }

    // Atomic Transaction to Create Booking & Attendance Record
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId: session.userId,
          slotId: slot.id,
          status: 'CONFIRMED',
        },
      });

      const attendance = await tx.attendance.create({
        data: {
          bookingId: booking.id,
          status: 'PENDING',
          markedBy: 'SYSTEM',
        },
      });

      return { booking, attendance };
    });

    const remainingVacancies = slot.capacity - (currentBooked + 1);

    return NextResponse.json({
      message: 'Booking confirmed successfully!',
      status: 'CONFIRMED',
      bookingId: result.booking.id,
      remainingVacancies,
    });
  } catch (error: any) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete booking' }, { status: 500 });
  }
}

// GET: Fetch user's bookings (or all if admin)
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    const whereClause: any = session.role === 'ADMIN' ? {} : { userId: session.userId };
    if (dateParam) {
      whereClause.slot = { date: dateParam };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        slot: true,
        user: {
          select: { id: true, memberId: true, gymMembershipId: true, name: true, email: true, phone: true },
        },
        attendance: true,
      },
      orderBy: { bookedAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}
