import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import {
  adminActionResponse,
  wouldRemoveLastAdmin,
} from "@/app/lib/admin-actions";
import { readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type UserStatusRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getBooleanField(value: unknown, fieldName: string) {
  if (!value || typeof value !== "object" || !(fieldName in value)) {
    return null;
  }

  const fieldValue = (value as Record<string, unknown>)[fieldName];

  return typeof fieldValue === "boolean" ? fieldValue : null;
}

export async function PUT(request: Request, context: UserStatusRouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await readJson(request);
    const isDisabled = getBooleanField(body, "isDisabled");

    if (isDisabled === null) {
      return adminActionResponse(
        { success: false, message: "Invalid user status." },
        400,
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isAdmin: true,
        isDisabled: true,
      },
    });

    if (!targetUser) {
      return adminActionResponse(
        { success: false, message: "User not found." },
        404,
      );
    }

    if (isDisabled && targetUser.id === admin.id) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    if (
      isDisabled &&
      targetUser.isAdmin &&
      (await wouldRemoveLastAdmin([targetUser.id]))
    ) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    if (targetUser.isDisabled === isDisabled) {
      return adminActionResponse({
        success: true,
        message: isDisabled ? "Already disabled." : "Already enabled.",
      });
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { isDisabled },
    });

    return adminActionResponse({ success: true, message: "Success." });
  } catch (error) {
    return authErrorResponse(error);
  }
}
