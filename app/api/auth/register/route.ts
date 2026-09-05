import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateEmailDomain, setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { memberId, gymMembershipId, name, email, phone, bloodGroup, password } = body;

    // Validation
    if (!memberId || !name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Email Domain Restriction Check (@somaiya.edu)
    const domainCheck = await validateEmailDomain(normalizedEmail);
    if (!domainCheck.isValid) {
      return NextResponse.json(
        {
          error: `Registration is restricted to approved organizational email domains (${domainCheck.allowedDomains.join(', ')}).`,
        },
        { status: 403 }
      );
    }

    // 2. Unique Member ID & Email Check
    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const existingMemberId = await prisma.user.findUnique({ where: { memberId: memberId.trim().toUpperCase() } });
    if (existingMemberId) {
      return NextResponse.json({ error: 'This Somaiya ID Card Number is already registered' }, { status: 400 });
    }

    // 3. Hash Password & Create User (Direct Instant Registration, No OTP required)
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        memberId: memberId.trim().toUpperCase(),
        gymMembershipId: gymMembershipId?.trim() || null,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        bloodGroup: bloodGroup?.trim() || 'O+',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });

    // 4. Auto Login New User Immediately
    await setSessionCookie({
      userId: user.id,
      memberId: user.memberId,
      name: user.name,
      email: user.email,
      role: 'MEMBER',
    });

    return NextResponse.json({
      message: 'Registration successful! Welcome to Ashtavakra Gym.',
      autoLoggedIn: true,
      redirectUrl: '/dashboard',
      user: {
        id: user.id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
