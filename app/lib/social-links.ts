import { SocialLinkType } from "@/app/generated/prisma/enums";
import { getStringField } from "@/app/lib/http";

export const socialLinkSelect = {
  id: true,
  type: true,
  platformName: true,
  url: true,
  imageUrl: true,
  sortOrder: true,
} as const;

export type SocialLinkInput = {
  type: SocialLinkType;
  platformName: string;
  url: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

function getOptionalStringField(value: unknown, fieldName: string) {
  const fieldValue = getStringField(value, fieldName);

  return fieldValue || null;
}

function getSortOrder(value: unknown) {
  if (!value || typeof value !== "object" || !("sortOrder" in value)) {
    return 0;
  }

  const rawValue = (value as Record<string, unknown>).sortOrder;

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Math.trunc(rawValue);
  }

  if (typeof rawValue === "string" && rawValue.trim() !== "") {
    const parsed = Number(rawValue);

    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

export function parseSocialLinkInput(value: unknown):
  | { ok: true; data: SocialLinkInput }
  | { ok: false; error: string } {
  const rawType = getStringField(value, "type") || SocialLinkType.link;
  const platformName = getStringField(value, "platformName");
  const sortOrder = getSortOrder(value);

  if (rawType !== SocialLinkType.link && rawType !== SocialLinkType.qrcode) {
    return { ok: false, error: "Social link type is invalid." };
  }

  if (!platformName) {
    return { ok: false, error: "Platform name is required." };
  }

  if (platformName.length > 50) {
    return { ok: false, error: "Platform name is too long." };
  }

  if (sortOrder === null) {
    return { ok: false, error: "Sort order is invalid." };
  }

  return {
    ok: true,
    data: {
      type: rawType,
      platformName,
      url: getOptionalStringField(value, "url"),
      imageUrl: getOptionalStringField(value, "imageUrl"),
      sortOrder,
    },
  };
}
