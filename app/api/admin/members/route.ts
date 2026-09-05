import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Search & filter members
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where: any = {
      role: 'MEMBER',
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { memberId: { contains: search } },
      ];
    }

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        memberId: true,
        gymMembershipId: true,
        name: true,
        email: true,
        phone: true,
        bloodGroup: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        bookings: {
          select: {
            id: true,
            status: true,
            attendance: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const membersWithStats = members.map((m) => {
      const totalBookings = m.bookings.length;
      const attendedCount = m.bookings.filter((b) => b.attendance?.status === 'ATTENDED').length;
      const noShowCount = m.bookings.filter((b) => b.attendance?.status === 'NOT_ATTENDED').length;
      const attendanceRate = totalBookings > 0 ? Math.round((attendedCount / totalBookings) * 100) : 100;

      return {
        id: m.id,
        memberId: m.memberId,
        gymMembershipId: m.gymMembershipId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        bloodGroup: m.bloodGroup,
        status: m.status,
        emailVerified: m.emailVerified,
        createdAt: m.createdAt,
        totalBookings,
        attendedCount,
        noShowCount,
        attendanceRate,
      };
    });

    return NextResponse.json({ members: membersWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch members' }, { status: 500 });
  }
}

// PATCH: Toggle Account Status (ACTIVE, INACTIVE, BLOCKED)
export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, status } = await req.json();

    if (!userId || !['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return NextResponse.json({ error: 'Valid userId and status required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, memberId: true, name: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: 'MEMBER_STATUS_CHANGE',
        entityType: 'USER',
        entityId: userId,
        newValue: status,
      },
    });

    return NextResponse.json({
      message: `Member ${updatedUser.name} (${updatedUser.memberId}) status updated to ${status}.`,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update member status' }, { status: 500 });
  }
}
