import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import {
  adminActionResponse,
  wouldRemoveLastAdmin,
} from "@/app/lib/admin-actions";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type AdminRoleRouteContext = {
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

export async function PUT(request: Request, context: AdminRoleRouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = await readJson(request);
    const requestedRole = getBooleanField(body, "isAdmin");
    const action = getStringField(body, "action");
    const shouldBeAdmin =
      requestedRole ?? (action === "appoint" ? true : action === "revoke" ? false : null);

    if (shouldBeAdmin === null) {
      return adminActionResponse(
        { success: false, message: "Invalid admin action." },
        400,
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        isAdmin: true,
      },
    });

    if (!targetUser) {
      return adminActionResponse(
        { success: false, message: "User not found." },
        404,
      );
    }

    if (shouldBeAdmin && targetUser.isAdmin) {
      return adminActionResponse({ success: true, message: "Already admin." });
    }

    if (!shouldBeAdmin && !targetUser.isAdmin) {
      return adminActionResponse({ success: true, message: "Already not admin." });
    }

    if (!shouldBeAdmin) {
      if (targetUser.id === admin.id || (await wouldRemoveLastAdmin([targetUser.id]))) {
        return adminActionResponse(
          { success: false, message: "Forbidden operation." },
          403,
        );
      }
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { isAdmin: shouldBeAdmin },
    });

    return adminActionResponse({ success: true, message: "Success." });
  } catch (error) {
    return authErrorResponse(error);
  }
}
