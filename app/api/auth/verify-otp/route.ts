import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: 'Email and OTP code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified' });
    }

    if (!user.otpCode || user.otpCode !== otpCode.trim()) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    if (user.otpExpiresAt && new Date() > new Date(user.otpExpiresAt)) {
      return NextResponse.json({ error: 'OTP code has expired. Please request a new one.' }, { status: 400 });
    }

    // Activate email verification
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Auto-login session cookie after verification
    await setSessionCookie({
      userId: updatedUser.id,
      memberId: updatedUser.memberId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role as 'MEMBER' | 'ADMIN',
    });

    return NextResponse.json({
      message: 'Email verified successfully! You are now logged in.',
      user: {
        id: updatedUser.id,
        memberId: updatedUser.memberId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
