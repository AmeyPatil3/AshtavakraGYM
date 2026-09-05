import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only owner of booking or admin can cancel
    if (session.role !== 'ADMIN' && booking.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden. Cannot cancel another member booking.' }, { status: 403 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ message: 'Booking is already cancelled' });
    }

    // Process cancellation & Automatic Waitlist Promotion with Preference Swap
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark target booking CANCELLED
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: session.role === 'ADMIN' ? 'Cancelled by Administrator' : 'Cancelled by Member',
        },
      });

      // 2. Check for next Waitlisted member for this slot (#1 position)
      const nextWaitlist = await tx.waitlist.findFirst({
        where: { slotId: booking.slotId, status: 'WAITING' },
        orderBy: { position: 'asc' },
      });

      let promotedUser = null;
      if (nextWaitlist) {
        // User Requirement: If the promoted waitlisted member already has a confirmed booking on another slot for that date, cancel that previous booking!
        const existingMemberDateBooking = await tx.booking.findFirst({
          where: {
            userId: nextWaitlist.userId,
            status: 'CONFIRMED',
            slot: { date: booking.slot.date },
          },
        });

        if (existingMemberDateBooking) {
          await tx.booking.update({
            where: { id: existingMemberDateBooking.id },
            data: {
              status: 'CANCELLED',
              cancelledAt: new Date(),
              cancellationReason: 'Automatically cancelled due to waitlist promotion to preferred slot',
            },
          });
        }

        // Promote waitlisted member to CONFIRMED for this slot
        const newBooking = await tx.booking.create({
          data: {
            userId: nextWaitlist.userId,
            slotId: booking.slotId,
            status: 'CONFIRMED',
          },
        });

        await tx.attendance.create({
          data: {
            bookingId: newBooking.id,
            status: 'PENDING',
            markedBy: 'WAITLIST_AUTO_PROMOTION',
          },
        });

        await tx.waitlist.update({
          where: { id: nextWaitlist.id },
          data: { status: 'PROMOTED' },
        });

        // Re-index remaining waitlisted members for this slot
        const remainingWaitlists = await tx.waitlist.findMany({
          where: { slotId: booking.slotId, status: 'WAITING' },
          orderBy: { position: 'asc' },
        });

        for (let i = 0; i < remainingWaitlists.length; i++) {
          await tx.waitlist.update({
            where: { id: remainingWaitlists[i].id },
            data: { position: i + 1 },
          });
        }

        promotedUser = nextWaitlist.userId;
      }

      return { cancelledBooking, promotedUser };
    });

    return NextResponse.json({
      message: result.promotedUser
        ? 'Booking cancelled successfully. The #1 waitlisted member was automatically promoted to this slot.'
        : 'Booking cancelled successfully.',
      promotedWaitlistUser: result.promotedUser,
    });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to cancel booking' }, { status: 500 });
  }
}
