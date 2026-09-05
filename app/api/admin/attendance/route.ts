import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Attendance list for Date & Slot
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const slotIdParam = searchParams.get('slotId');

    const whereClause: any = {
      slot: { date: dateParam },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    };

    if (slotIdParam) {
      whereClause.slotId = slotIdParam;
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
      orderBy: [{ slot: { startTime: 'asc' } }, { user: { name: 'asc' } }],
    });

    const attendanceRecords = bookings.map((b) => ({
      bookingId: b.id,
      memberId: b.user.memberId,
      gymMembershipId: b.user.gymMembershipId,
      name: b.user.name,
      email: b.user.email,
      slotId: b.slot.id,
      slotTime: `${b.slot.startTime} - ${b.slot.endTime}`,
      slotPeriod: b.slot.period,
      status: b.attendance?.status || 'PENDING',
      markedBy: b.attendance?.markedBy || 'N/A',
      updatedAt: b.attendance?.updatedAt || b.bookedAt,
    }));

    return NextResponse.json({
      date: dateParam,
      records: attendanceRecords,
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST: Update Attendance (bulk or single)
export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    // updates: Array of { bookingId: string, status: 'ATTENDED' | 'NOT_ATTENDED' | 'EXCUSED' | 'PENDING' }
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates array payload' }, { status: 400 });
    }

    const now = new Date();

    const results = await prisma.$transaction(
      updates.map((item) =>
        prisma.attendance.upsert({
          where: { bookingId: item.bookingId },
          update: {
            status: item.status,
            markedBy: session.name || session.memberId,
            checkInTime: item.status === 'ATTENDED' ? now : null,
            updatedAt: now,
          },
          create: {
            bookingId: item.bookingId,
            status: item.status,
            markedBy: session.name || session.memberId,
            checkInTime: item.status === 'ATTENDED' ? now : null,
          },
        })
      )
    );

    // Audit Log Entry
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: 'ATTENDANCE_MARKED',
        entityType: 'ATTENDANCE',
        entityId: `BATCH_${updates.length}`,
        newValue: JSON.stringify(updates),
      },
    });

    return NextResponse.json({
      message: `Successfully updated attendance for ${results.length} record(s).`,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}
