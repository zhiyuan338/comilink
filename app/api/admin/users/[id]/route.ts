import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import {
  adminActionResponse,
  getUserIdsWithCollections,
  wouldRemoveLastAdmin,
} from "@/app/lib/admin-actions";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type AdminUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: AdminUserRouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
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

    if (targetUser.id === admin.id) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    if (targetUser.isAdmin && (await wouldRemoveLastAdmin([targetUser.id]))) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    const userIdsWithCollections = await getUserIdsWithCollections([targetUser.id]);

    if (userIdsWithCollections.has(targetUser.id)) {
      return adminActionResponse(
        {
          success: false,
          message: "Cannot delete users with collection history.",
        },
        409,
      );
    }

    await prisma.user.delete({
      where: { id: targetUser.id },
    });

    return adminActionResponse({ success: true, message: "Success." });
  } catch (error) {
    return authErrorResponse(error);
  }
}
