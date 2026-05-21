import { NextResponse } from "next/server";
import { authErrorResponse, requireUser } from "@/app/lib/auth";
import { readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";
import { parseSocialLinkInput } from "@/app/lib/social-links";

export const runtime = "nodejs";

type SocialLinkRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: SocialLinkRouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);
    const parsed = parseSocialLinkInput(body);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await prisma.socialLink.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: parsed.data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Social link was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: SocialLinkRouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await prisma.socialLink.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Social link was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return authErrorResponse(error);
  }
}
