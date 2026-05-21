import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MeClient from "@/app/me/me-client";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { socialLinkSelect } from "@/app/lib/social-links";

async function getAppUrl() {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("host") || "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") || "http";

  return `${protocol}://${host}`;
}

export default async function MePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnTo=/me");
  }

  const [appUrl, socialLinks] = await Promise.all([
    getAppUrl(),
    prisma.socialLink.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: socialLinkSelect,
    }),
  ]);

  return (
    <MeClient
      initialSocialLinks={socialLinks}
      initialUser={{
        id: user.id,
        qq: user.qq,
        username: user.username,
        stampImageUrl: user.stampImageUrl,
        nfcUrl: `${appUrl}/u/${encodeURIComponent(user.token)}`,
      }}
    />
  );
}
