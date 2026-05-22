import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import { adminActionResponse } from "@/app/lib/admin-actions";
import { hashPassword } from "@/app/lib/password";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type ResetPasswordRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: ResetPasswordRouteContext,
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        qq: true,
      },
    });

    if (!user) {
      return adminActionResponse(
        { success: false, message: "User not found." },
        404,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(user.qq),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset to user's QQ number.",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
