import { NextResponse } from 'next/server';
import { removeSessionCookie, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  await removeSessionCookie();
  return NextResponse.json({ message: 'Logged out successfully' });
}

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      memberId: true,
      gymMembershipId: true,
      name: true,
      email: true,
      phone: true,
      bloodGroup: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
