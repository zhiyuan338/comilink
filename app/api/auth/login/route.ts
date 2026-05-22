import { NextResponse } from "next/server";
import { ensureInitialAdmin } from "@/app/lib/initial-admin";
import { prisma } from "@/app/lib/prisma";
import { getStringField, readJson } from "@/app/lib/http";
import { verifyPassword } from "@/app/lib/password";
import { setSessionCookie } from "@/app/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureInitialAdmin();

  const body = await readJson(request);
  const qq = getStringField(body, "qq");
  const password = getStringField(body, "password", { trim: false });

  if (!qq || !password) {
    return NextResponse.json(
      { error: "QQ and password are required." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { qq },
    select: {
      id: true,
      passwordHash: true,
      isDisabled: true,
    },
  });

  const passwordMatches = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || user.isDisabled || !passwordMatches) {
    return NextResponse.json(
      { error: "Invalid QQ or password." },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);

  return NextResponse.json({ success: true });
}
