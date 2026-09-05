import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, validateEmailDomain } from '@/lib/auth';

// Hardcoded Production Admin Credentials
const HARDCODED_ADMIN_EMAIL = 'admin@somaiya.edu';
const HARDCODED_ADMIN_PASSWORD = 'Admin@123';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 0. Email Domain Restriction Check (@somaiya.edu)
    const domainCheck = await validateEmailDomain(normalizedEmail);
    if (!domainCheck.isValid) {
      return NextResponse.json(
        { error: 'Only official @somaiya.edu email addresses are permitted.' },
        { status: 403 }
      );
    }

    // 1. Hardcoded Admin Authentication Check
    if (normalizedEmail === HARDCODED_ADMIN_EMAIL && password === HARDCODED_ADMIN_PASSWORD) {
      let admin = await prisma.user.findUnique({
        where: { email: HARDCODED_ADMIN_EMAIL },
      });

      if (!admin) {
        const passwordHash = await bcrypt.hash(HARDCODED_ADMIN_PASSWORD, 10);
        admin = await prisma.user.create({
          data: {
            memberId: 'ADM001',
            name: 'Gym Administrator',
            email: HARDCODED_ADMIN_EMAIL,
            phone: '9876500000',
            bloodGroup: 'O+',
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
          },
        });
      }

      await setSessionCookie({
        userId: admin.id,
        memberId: admin.memberId,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
      });

      return NextResponse.json({
        message: 'Admin login successful',
        user: {
          id: admin.id,
          memberId: admin.memberId,
          name: admin.name,
          email: admin.email,
          role: 'ADMIN',
        },
      });
    }

    // 2. Regular Member Authentication
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
      return NextResponse.json({ error: `Your account is ${user.status.toLowerCase()}. Please contact administration.` }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check email verification for member accounts
    if (!user.emailVerified && user.role === 'MEMBER') {
      return NextResponse.json(
        {
          error: 'Your email address is not verified yet.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Set HTTP-only session cookie
    await setSessionCookie({
      userId: user.id,
      memberId: user.memberId,
      name: user.name,
      email: user.email,
      role: user.role as 'MEMBER' | 'ADMIN',
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
