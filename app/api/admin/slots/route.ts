import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Fetch slots for Admin management
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const slots = await prisma.slot.findMany({
      where: { date: dateParam },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const mappedSlots = slots.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      period: s.period,
      capacity: s.capacity,
      bookedCount: s.bookings.length,
      vacancies: Math.max(0, s.capacity - s.bookings.length),
      status: s.status,
    }));

    return NextResponse.json({ date: dateParam, slots: mappedSlots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch slots' }, { status: 500 });
  }
}

// PATCH: Update capacity for a specific slot or bulk update for date
export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { slotId, capacity, date } = await req.json();

    if (!capacity || capacity < 1) {
      return NextResponse.json({ error: 'Valid capacity (at least 1) is required' }, { status: 400 });
    }

    if (slotId) {
      const slot = await prisma.slot.findUnique({ where: { id: slotId } });
      if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

      const updatedSlot = await prisma.slot.update({
        where: { id: slotId },
        data: { capacity: parseInt(capacity, 10) },
      });

      await prisma.auditLog.create({
        data: {
          adminId: session.userId,
          action: 'SLOT_CAPACITY_CHANGE',
          entityType: 'SLOT',
          entityId: slotId,
          oldValue: slot.capacity.toString(),
          newValue: capacity.toString(),
        },
      });

      return NextResponse.json({
        message: `Capacity for slot (${updatedSlot.startTime}-${updatedSlot.endTime}) updated to ${updatedSlot.capacity}.`,
        slot: updatedSlot,
      });
    }

    if (date) {
      // Bulk update all slots for a date
      const updatedCount = await prisma.slot.updateMany({
        where: { date },
        data: { capacity: parseInt(capacity, 10) },
      });

      await prisma.auditLog.create({
        data: {
          adminId: session.userId,
          action: 'DATE_SLOTS_CAPACITY_CHANGE',
          entityType: 'DATE_SLOTS',
          entityId: date,
          newValue: capacity.toString(),
        },
      });

      return NextResponse.json({
        message: `Capacity for all slots on ${date} updated to ${capacity}.`,
        count: updatedCount.count,
      });
    }

    return NextResponse.json({ error: 'slotId or date required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update slot capacity' }, { status: 500 });
  }
}
