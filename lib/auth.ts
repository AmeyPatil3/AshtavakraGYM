import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ashtavakra-gym-jwt-secret-key-somaiya-2026';
const COOKIE_NAME = 'gym_session';

export interface UserSessionPayload {
  userId: string;
  memberId: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
}

export function signJwtToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwtToken(token);
}

export async function setSessionCookie(payload: UserSessionPayload) {
  const token = signJwtToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function validateEmailDomain(email: string): Promise<{ isValid: boolean; allowedDomains: string[] }> {
  const settings = await prisma.gymSettings.findUnique({ where: { id: 'default' } });
  const allowedStr = settings?.allowedDomains || 'somaiya.edu';
  const allowedDomains = allowedStr.split(',').map((d) => d.trim().toLowerCase());

  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return { isValid: false, allowedDomains };
  
  const domain = parts[1];
  const isValid = allowedDomains.some((allowed) => domain === allowed || domain.endsWith('.' + allowed));
  return { isValid, allowedDomains };
}
