import { NextResponse } from "next/server";
import { getPublicUserByToken } from "@/app/lib/public-users";

export const runtime = "nodejs";

type UserByTokenRouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_request: Request, context: UserByTokenRouteContext) {
  const { token } = await context.params;
  const user = await getPublicUserByToken(token);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(user);
}
