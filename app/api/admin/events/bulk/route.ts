import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import {
  adminActionResponse,
  getStringArrayField,
} from "@/app/lib/admin-actions";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    await requireAdmin();

    const body = await readJson(request);
    const ids = getStringArrayField(body, "ids");
    const action = getStringField(body, "action");

    if (action !== "activate" || ids.length !== 1) {
      return adminActionResponse(
        { success: false, message: "Select exactly one event to activate." },
        400,
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: ids[0] },
      select: { id: true },
    });

    if (!event) {
      return adminActionResponse(
        { success: false, message: "Event not found." },
        404,
      );
    }

    await prisma.$transaction([
      prisma.event.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      prisma.event.update({
        where: { id: event.id },
        data: { isActive: true },
      }),
    ]);

    return adminActionResponse({
      success: true,
      message: "Active event updated.",
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body = await readJson(request);
    const ids = getStringArrayField(body, "ids");

    if (ids.length === 0) {
      return adminActionResponse(
        { success: false, message: "No events selected." },
        400,
      );
    }

    const collections = await prisma.collection.findMany({
      where: { eventId: { in: ids } },
      select: { eventId: true },
    });
    const eventIdsWithCollections = new Set(
      collections
        .map((collection) => collection.eventId)
        .filter((eventId): eventId is string => Boolean(eventId)),
    );
    const deletableIds = ids.filter((id) => !eventIdsWithCollections.has(id));

    if (deletableIds.length === 0) {
      return adminActionResponse(
        {
          success: false,
          message: "No events can be deleted without breaking collection history.",
        },
        409,
      );
    }

    const result = await prisma.event.deleteMany({
      where: { id: { in: deletableIds } },
    });
    const skipped = ids.length - result.count;

    return adminActionResponse({
      success: true,
      message: `Deleted ${result.count} event(s), skipped ${skipped}.`,
    });
  } catch (error) {
    return authErrorResponse(error);
  }
}
