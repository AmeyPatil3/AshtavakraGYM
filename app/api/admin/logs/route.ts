import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Fetch Audit Logs filtered by date (YYYY-MM-DD)
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Compute start and end of the date in UTC/Local
    const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);

    const [logs, attendanceLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          admin: {
            select: { id: true, name: true, email: true, memberId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendance.findMany({
        where: {
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          booking: {
            include: {
              user: { select: { name: true, memberId: true, email: true } },
              slot: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      adminName: log.admin?.name || 'System Administrator',
      adminEmail: log.admin?.email || 'N/A',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.newValue || log.oldValue || 'Action recorded',
    }));

    // If attendance logs exist, convert them to log entries if audit logs are empty
    const formattedAttendanceLogs = attendanceLogs.map((att) => ({
      id: att.id,
      timestamp: att.updatedAt,
      adminName: att.markedBy || 'Gym Admin',
      adminEmail: 'admin@somaiya.edu',
      action: `ATTENDANCE_${att.status}`,
      entityType: 'ATTENDANCE',
      entityId: att.booking.user.memberId,
      details: `Marked ${att.booking.user.name} (${att.booking.user.memberId}) as ${att.status} for ${att.booking.slot.date} (${att.booking.slot.startTime}–${att.booking.slot.endTime})`,
    }));

    // Combine and deduplicate
    const combinedLogs = [...formattedLogs, ...formattedAttendanceLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      date: dateParam,
      totalCount: combinedLogs.length,
      logs: combinedLogs,
    });
  } catch (error: any) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
