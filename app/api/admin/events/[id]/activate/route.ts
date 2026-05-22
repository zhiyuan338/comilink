import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import { adminActionResponse } from "@/app/lib/admin-actions";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

type ActivateEventRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(_request: Request, context: ActivateEventRouteContext) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id },
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
        where: { id },
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
