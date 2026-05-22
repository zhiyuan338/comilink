import { prisma } from "@/app/lib/prisma";

export type AdminActionResult = {
  success: boolean;
  message: string;
};

export function getStringArrayField(value: unknown, fieldName: string) {
  if (!value || typeof value !== "object" || !(fieldName in value)) {
    return [];
  }

  const fieldValue = (value as Record<string, unknown>)[fieldName];

  if (!Array.isArray(fieldValue)) {
    return [];
  }

  return fieldValue
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function adminActionResponse(result: AdminActionResult, status = 200) {
  return Response.json(result, { status });
}

export async function wouldRemoveLastAdmin(userIds: string[]) {
  if (userIds.length === 0) {
    return false;
  }

  const [adminCount, selectedAdminCount] = await Promise.all([
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.user.count({
      where: {
        id: { in: userIds },
        isAdmin: true,
      },
    }),
  ]);

  return selectedAdminCount > 0 && selectedAdminCount >= adminCount;
}

export async function getUserIdsWithCollections(userIds: string[]) {
  if (userIds.length === 0) {
    return new Set<string>();
  }

  const collections = await prisma.collection.findMany({
    where: {
      OR: [{ userAId: { in: userIds } }, { userBId: { in: userIds } }],
    },
    select: {
      userAId: true,
      userBId: true,
    },
  });
  const blockedUserIds = new Set<string>();

  for (const collection of collections) {
    if (userIds.includes(collection.userAId)) {
      blockedUserIds.add(collection.userAId);
    }

    if (userIds.includes(collection.userBId)) {
      blockedUserIds.add(collection.userBId);
    }
  }

  return blockedUserIds;
}
