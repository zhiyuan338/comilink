import { NextResponse } from "next/server";
import { ensureInitialAdmin } from "@/app/lib/initial-admin";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const currentUserSelect = {
  id: true,
  qq: true,
  username: true,
  token: true,
  stampImageUrl: true,
  isAdmin: true,
  isDisabled: true,
} as const;

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentUser() {
  await ensureInitialAdmin();

  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: currentUserSelect,
  });

  if (!user || user.isDisabled) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!user.isAdmin) {
    throw new AuthError("Forbidden", 403);
  }

  return user;
}

export function isSignedIn(user: CurrentUser | null | undefined) {
  return Boolean(user);
}

export function isAdmin(user: CurrentUser | null | undefined) {
  return Boolean(user?.isAdmin);
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status = 401,
  ) {
    super(message);
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.message,
      },
      { status: error.status },
    );
  }

  throw error;
}
