import { NextResponse } from "next/server";
import { getStringField, readJson } from "@/app/lib/http";
import { prisma } from "@/app/lib/prisma";
import { getSession } from "@/app/lib/session";

export const runtime = "nodejs";

type CollectStatus =
  | "collected"
  | "already_collected"
  | "self_visit"
  | "not_logged_in"
  | "target_not_found"
  | "user_disabled";

function collectResponse(
  status: CollectStatus,
  options: {
    alreadyCollected?: boolean;
    selfVisit?: boolean;
    eventId?: string | null;
  } = {},
) {
  return NextResponse.json({
    success: true,
    status,
    alreadyCollected: options.alreadyCollected ?? false,
    selfVisit: options.selfVisit ?? false,
    eventId: options.eventId ?? null,
  });
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  const targetToken = getStringField(body, "targetToken");

  if (!targetToken) {
    return NextResponse.json(
      { error: "targetToken is required." },
      { status: 400 },
    );
  }

  const session = await getSession();

  if (!session) {
    return collectResponse("not_logged_in");
  }

  const [currentUser, targetUser, activeEvent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, isDisabled: true },
    }),
    prisma.user.findUnique({
      where: { token: targetToken },
      select: { id: true, isDisabled: true },
    }),
    prisma.event.findFirst({
      where: { isActive: true },
      select: { id: true },
    }),
  ]);

  if (!currentUser || currentUser.isDisabled) {
    return collectResponse("user_disabled", { eventId: activeEvent?.id });
  }

  if (!targetUser) {
    return collectResponse("target_not_found", { eventId: activeEvent?.id });
  }

  if (targetUser.isDisabled) {
    return collectResponse("user_disabled", { eventId: activeEvent?.id });
  }

  if (currentUser.id === targetUser.id) {
    return collectResponse("self_visit", {
      selfVisit: true,
      eventId: activeEvent?.id,
    });
  }

  const [userAId, userBId] =
    currentUser.id < targetUser.id
      ? [currentUser.id, targetUser.id]
      : [targetUser.id, currentUser.id];
  const eventId = activeEvent?.id ?? null;

  try {
    await prisma.collection.create({
      data: {
        userAId,
        userBId,
        eventId,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return collectResponse("already_collected", {
        alreadyCollected: true,
        eventId,
      });
    }

    throw error;
  }

  return collectResponse("collected", { eventId });
}
