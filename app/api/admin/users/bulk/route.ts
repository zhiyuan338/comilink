import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import {
  adminActionResponse,
  getStringArrayField,
  getUserIdsWithCollections,
  wouldRemoveLastAdmin,
} from "@/app/lib/admin-actions";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson(request);
    const action = getStringField(body, "action");
    const ids = getStringArrayField(body, "ids");

    if (ids.length === 0 || (action !== "disable" && action !== "enable")) {
      return adminActionResponse(
        { success: false, message: "Invalid bulk user action." },
        400,
      );
    }

    const isDisabled = action === "disable";
    const targetIds = ids.filter((id) => id !== admin.id);

    if (isDisabled && (await wouldRemoveLastAdmin(targetIds))) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    if (targetIds.length === 0) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: targetIds } },
      data: { isDisabled },
    });

    return adminActionResponse({
      success: true,
      message: `${isDisabled ? "Disabled" : "Enabled"} ${result.count} user(s).`,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await readJson(request);
    const ids = getStringArrayField(body, "ids");

    if (ids.length === 0) {
      return adminActionResponse(
        { success: false, message: "No users selected." },
        400,
      );
    }

    const targetIds = ids.filter((id) => id !== admin.id);

    if (await wouldRemoveLastAdmin(targetIds)) {
      return adminActionResponse(
        { success: false, message: "Forbidden operation." },
        403,
      );
    }

    const usersWithCollections = await getUserIdsWithCollections(targetIds);
    const deletableIds = targetIds.filter((id) => !usersWithCollections.has(id));

    if (deletableIds.length === 0) {
      return adminActionResponse(
        {
          success: false,
          message: "No users can be deleted without breaking collection history.",
        },
        409,
      );
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: deletableIds } },
    });
    const skipped = ids.length - result.count;

    return adminActionResponse({
      success: true,
      message: `Deleted ${result.count} user(s), skipped ${skipped}.`,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
