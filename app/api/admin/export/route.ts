import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'attendance'; // 'members' | 'bookings' | 'attendance'

    let csvContent = '';
    let filename = `ashtavakra_export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'members') {
      const members = await prisma.user.findMany({
        where: { role: 'MEMBER' },
        orderBy: { memberId: 'asc' },
      });

      const headers = ['Member ID', 'Gym Membership ID', 'Full Name', 'Email', 'Phone', 'Blood Group', 'Status', 'Registration Date'];
      const rows = members.map((m) => [
        m.memberId,
        m.gymMembershipId || 'N/A',
        `"${m.name}"`,
        m.email,
        m.phone,
        m.bloodGroup,
        m.status,
        m.createdAt.toISOString().split('T')[0],
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'bookings') {
      const bookings = await prisma.booking.findMany({
        include: { user: true, slot: true },
        orderBy: { bookedAt: 'desc' },
      });

      const headers = ['Booking ID', 'Date', 'Slot Time', 'Period', 'Member ID', 'Gym Membership ID', 'Member Name', 'Booking Status', 'Booked At'];
      const rows = bookings.map((b) => [
        b.id,
        b.slot.date,
        `"${b.slot.startTime} - ${b.slot.endTime}"`,
        b.slot.period,
        b.user.memberId,
        b.user.gymMembershipId || 'N/A',
        `"${b.user.name}"`,
        b.status,
        b.bookedAt.toISOString(),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      // Default: Attendance
      const attendance = await prisma.attendance.findMany({
        include: {
          booking: {
            include: { user: true, slot: true },
          },
        },
        orderBy: { markedAt: 'desc' },
      });

      const headers = ['Date', 'Slot Time', 'Period', 'Member ID', 'Gym Membership ID', 'Member Name', 'Attendance Status', 'Marked By', 'Check-In Time'];
      const rows = attendance.map((a) => [
        a.booking.slot.date,
        `"${a.booking.slot.startTime} - ${a.booking.slot.endTime}"`,
        a.booking.slot.period,
        a.booking.user.memberId,
        a.booking.user.gymMembershipId || 'N/A',
        `"${a.booking.user.name}"`,
        a.status,
        `"${a.markedBy}"`,
        a.checkInTime ? a.checkInTime.toISOString() : 'N/A',
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate export CSV' }, { status: 500 });
  }
}
