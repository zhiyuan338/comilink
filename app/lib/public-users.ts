import { prisma } from "@/app/lib/prisma";
import { socialLinkSelect } from "@/app/lib/social-links";

export async function getPublicUserByToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { token },
    select: {
      id: true,
      username: true,
      stampImageUrl: true,
      isDisabled: true,
      socialLinks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: socialLinkSelect,
      },
    },
  });

  if (!user || user.isDisabled) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    stampImageUrl: user.stampImageUrl,
    socialLinks: user.socialLinks,
  };
}
