import { NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/app/lib/auth";
import { getAdminUsers } from "@/app/lib/admin-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const data = await getAdminUsers({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("q"),
    });

    return NextResponse.json(data);
  } catch (error) {
    return authErrorResponse(error);
  }
}
