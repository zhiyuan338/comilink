import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import { adminActionResponse } from "@/app/lib/admin-actions";
import { getAdminEvents } from "@/app/lib/admin-data";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const data = await getAdminEvents({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("q"),
    });

    return NextResponse.json(data);
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await readJson(request);
    const name = getStringField(body, "name");
    const description = getStringField(body, "description");

    if (!name) {
      return adminActionResponse(
        { success: false, message: "Event name is required." },
        400,
      );
    }

    if (name.length > 100) {
      return adminActionResponse(
        { success: false, message: "Event name is too long." },
        400,
      );
    }

    if (description && description.length > 500) {
      return adminActionResponse(
        { success: false, message: "Event description is too long." },
        400,
      );
    }

    await prisma.event.create({
      data: {
        name,
        description: description || null,
      },
    });

    return adminActionResponse({ success: true, message: "Event created." });
  } catch (error) {
    return authErrorResponse(error);
  }
}
