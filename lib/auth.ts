// lib/auth.ts
import { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { getServerSession } from 'next-auth';
import { ensureDemoDbSchema } from './ensure-demo-db';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      segment?: string;
      loyaltyTier?: string;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    segment?: string;
    loyaltyTier?: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    role?: string;
    segment?: string;
    loyaltyTier?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await ensureDemoDbSchema().catch(err => {
          console.warn('[auth.authorize] ensureDemoDbSchema warning:', err);
        });

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          segment: user.segment,
          loyaltyTier: user.loyaltyTier,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role || 'USER';
        token.segment = user.segment;
        token.loyaltyTier = user.loyaltyTier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.segment = token.segment;
        session.user.loyaltyTier = token.loyaltyTier;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export const getCurrentUser = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getCurrentSession = async () => {
  return await getServerSession(authOptions);
};

export const createUser = async (data: {
  email: string;
  password: string;
  name?: string;
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 12);

  return await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
};
