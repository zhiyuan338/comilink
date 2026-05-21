import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/app/lib/auth";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson(request);
    const username = getStringField(body, "username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 },
      );
    }

    if (username.length > 50) {
      return NextResponse.json(
        { error: "Username is too long." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
