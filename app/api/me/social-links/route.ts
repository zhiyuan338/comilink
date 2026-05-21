import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/app/lib/auth";
import { readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";
import {
  parseSocialLinkInput,
  socialLinkSelect,
} from "@/app/lib/social-links";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.socialLink.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: socialLinkSelect,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await readJson(request);
    const parsed = parseSocialLinkInput(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await prisma.socialLink.create({
      data: {
        userId: user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
