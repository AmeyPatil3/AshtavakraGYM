import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.gymSettings.findUnique({ where: { id: 'default' } });
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { defaultCapacity, morningStart, morningEnd, eveningStart, eveningEnd, allowedDomains } = body;

    const updated = await prisma.gymSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(defaultCapacity && { defaultCapacity: parseInt(defaultCapacity, 10) }),
        ...(morningStart && { morningStart }),
        ...(morningEnd && { morningEnd }),
        ...(eveningStart && { eveningStart }),
        ...(eveningEnd && { eveningEnd }),
        ...(allowedDomains && { allowedDomains }),
      },
      create: {
        id: 'default',
        defaultCapacity: defaultCapacity ? parseInt(defaultCapacity, 10) : 25,
        morningStart: morningStart || '06:00',
        morningEnd: morningEnd || '09:00',
        eveningStart: eveningStart || '16:00',
        eveningEnd: eveningEnd || '21:00',
        allowedDomains: allowedDomains || 'somaiya.edu',
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        action: 'SETTINGS_UPDATE',
        entityType: 'GYM_SETTINGS',
        entityId: 'default',
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({
      message: 'Gym settings updated successfully.',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
