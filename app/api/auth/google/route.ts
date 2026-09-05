import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, validateEmailDomain } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required for Google Sign-In' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Email Domain Restriction Check (@somaiya.edu)
    const domainCheck = await validateEmailDomain(normalizedEmail);
    if (!domainCheck.isValid) {
      return NextResponse.json(
        {
          error: `Only official Somaiya email addresses (${domainCheck.allowedDomains.map(d => '@' + d).join(', ')}) are permitted.`,
        },
        { status: 403 }
      );
    }

    // 2. Check if user already exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      if (user.status === 'BLOCKED' || user.status === 'INACTIVE') {
        return NextResponse.json(
          { error: `Your account is ${user.status.toLowerCase()}. Please contact administration.` },
          { status: 403 }
        );
      }

      // Automatically set session cookie for existing user
      await setSessionCookie({
        userId: user.id,
        memberId: user.memberId,
        name: user.name,
        email: user.email,
        role: user.role as 'MEMBER' | 'ADMIN',
      });

      return NextResponse.json({
        success: true,
        registered: true,
        redirectUrl: user.role === 'ADMIN' ? '/admin' : '/dashboard',
        user: {
          id: user.id,
          memberId: user.memberId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // 3. Admin Email Check (Designated Admin Google Account)
    const designatedAdminEmail = (process.env.ADMIN_EMAIL || 'admin@somaiya.edu').trim().toLowerCase();
    if (normalizedEmail === designatedAdminEmail) {
      let adminUser = await prisma.user.findUnique({ where: { email: designatedAdminEmail } });
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            memberId: 'ADM001',
            name: name ? name.trim() : 'Ashtavakra Gym Administrator',
            email: designatedAdminEmail,
            phone: '9876500000',
            bloodGroup: 'O+',
            passwordHash: '$2a$10$UnusedHashForGoogleAuthUser1234567890123456',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
          },
        });
      }

      await setSessionCookie({
        userId: adminUser.id,
        memberId: adminUser.memberId,
        name: adminUser.name,
        email: adminUser.email,
        role: 'ADMIN',
      });

      return NextResponse.json({
        success: true,
        registered: true,
        redirectUrl: '/admin',
        user: {
          id: adminUser.id,
          memberId: adminUser.memberId,
          name: adminUser.name,
          email: adminUser.email,
          role: 'ADMIN',
        },
      });
    }

    // 4. Regular User does not exist -> Pre-fill details for first-time registration
    return NextResponse.json({
      success: true,
      registered: false,
      googleEmail: normalizedEmail,
      googleName: name ? name.trim() : '',
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during Google Sign-In' }, { status: 500 });
  }
}
