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
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 1. Prepare trend date range
    const targetDateObj = new Date(`${dateParam}T00:00:00`);
    const trendDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(targetDateObj);
      d.setDate(targetDateObj.getDate() - i);
      trendDates.push(d.toISOString().split('T')[0]);
    }

    // 2. Fetch all independent metrics in parallel (collapses cross-continental DB roundtrips)
    const [totalMembers, activeMembers, dateSlots, trendSlots] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.slot.findMany({
        where: { date: dateParam, status: 'ACTIVE' },
        include: {
          bookings: {
            include: { attendance: true },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.slot.findMany({
        where: { date: { in: trendDates }, status: 'ACTIVE' },
        include: {
          bookings: {
            include: { attendance: true },
          },
        },
      }),
    ]);

    let dateTotalBookings = 0;
    let dateAttended = 0;
    let dateNoShow = 0;
    let dateCapacityTotal = 0;

    const slotSummaries = dateSlots.map((slot) => {
      const confirmedBookings = slot.bookings.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status));
      const booked = confirmedBookings.length;
      const attended = confirmedBookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
      const noShow = confirmedBookings.filter((b) => b.attendance?.status === 'NOT_ATTENDED').length;
      const vacancies = Math.max(0, slot.capacity - booked);

      dateTotalBookings += booked;
      dateAttended += attended;
      dateNoShow += noShow;
      dateCapacityTotal += slot.capacity;

      return {
        id: slot.id,
        time: `${slot.startTime} - ${slot.endTime}`,
        period: slot.period,
        capacity: slot.capacity,
        booked,
        vacancies,
        attended,
        noShow,
        utilization: slot.capacity > 0 ? Math.round((booked / slot.capacity) * 100) : 0,
      };
    });

    const utilizationRate = dateCapacityTotal > 0 ? Math.round((dateTotalBookings / dateCapacityTotal) * 100) : 0;
    const attendanceRate = dateTotalBookings > 0 ? Math.round((dateAttended / dateTotalBookings) * 100) : 100;

    const dateMap: Record<string, { date: string; bookings: number; attended: number }> = {};
    trendDates.forEach((d) => {
      dateMap[d] = { date: d, bookings: 0, attended: 0 };
    });

    trendSlots.forEach((slot) => {
      if (dateMap[slot.date]) {
        const confirmed = slot.bookings.filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status));
        dateMap[slot.date].bookings += confirmed.length;
        dateMap[slot.date].attended += confirmed.filter((b) => b.attendance?.status === 'ATTENDED').length;
      }
    });

    const chartTrend = Object.values(dateMap);

    return NextResponse.json({
      date: dateParam,
      kpis: {
        totalMembers,
        activeMembers,
        dateTotalBookings,
        dateAttended,
        dateNoShow,
        utilizationRate,
        attendanceRate,
      },
      slots: slotSummaries,
      trendData: chartTrend,
    });
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
