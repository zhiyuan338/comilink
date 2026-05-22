import { existsSync } from "node:fs";
import process from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  Prisma,
  PrismaClient,
  SocialLinkType,
} from "../app/generated/prisma/client";

const loadEnvFile = (
  process as typeof process & {
    loadEnvFile?: (path?: string) => void;
  }
).loadEnvFile;

if (existsSync(".env")) {
  loadEnvFile?.(".env");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const TEST_USER_COUNT = 10;
const TEST_QQ_START = 100000001;
const PASSWORD_SALT_ROUNDS = 12;
const ACTIVE_EVENT_ID = "seed-active-event";
const INACTIVE_EVENT_ID = "seed-inactive-event";

function getUserNumber(index: number) {
  return String(index).padStart(2, "0");
}

function buildSocialLinks(
  userId: string,
  index: number,
  qq: string,
): Prisma.SocialLinkCreateManyInput[] {
  const userNumber = getUserNumber(index);
  const links: Prisma.SocialLinkCreateManyInput[] = [];

  if (index % 2 === 1) {
    links.push({
      userId,
      type: SocialLinkType.link,
      platformName: "Homepage",
      url: `https://example.com/comilink/testuser${userNumber}`,
      sortOrder: 0,
    });
  }

  if (index % 3 === 0) {
    links.push({
      userId,
      type: SocialLinkType.qrcode,
      platformName: "QR Contact",
      imageUrl: null,
      sortOrder: 1,
    });
  }

  if (index % 4 === 0) {
    links.push({
      userId,
      type: SocialLinkType.link,
      platformName: "Bilibili",
      url: `https://space.bilibili.com/${qq}`,
      sortOrder: 2,
    });
  }

  return links;
}

async function seedEvents() {
  await prisma.event.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  await prisma.event.upsert({
    where: { id: INACTIVE_EVENT_ID },
    update: {
      name: "ComiLink Test Event",
      description: "Inactive seed event for local testing.",
      isActive: false,
    },
    create: {
      id: INACTIVE_EVENT_ID,
      name: "ComiLink Test Event",
      description: "Inactive seed event for local testing.",
      isActive: false,
    },
  });

  await prisma.event.upsert({
    where: { id: ACTIVE_EVENT_ID },
    update: {
      name: "ComiLink Active Test Event",
      description: "Active seed event for local testing.",
      isActive: true,
    },
    create: {
      id: ACTIVE_EVENT_ID,
      name: "ComiLink Active Test Event",
      description: "Active seed event for local testing.",
      isActive: true,
    },
  });
}

async function seedUsers() {
  for (let index = 1; index <= TEST_USER_COUNT; index += 1) {
    const userNumber = getUserNumber(index);
    const qq = String(TEST_QQ_START + index - 1);
    const passwordHash = await bcrypt.hash(qq, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { qq },
      update: {
        passwordHash,
        username: `TestUser${userNumber}`,
        token: `test-user-${userNumber}`,
        isAdmin: false,
        isDisabled: false,
      },
      create: {
        qq,
        passwordHash,
        username: `TestUser${userNumber}`,
        token: `test-user-${userNumber}`,
        isAdmin: false,
        isDisabled: false,
      },
    });

    await prisma.socialLink.deleteMany({
      where: { userId: user.id },
    });

    const socialLinks = buildSocialLinks(user.id, index, qq);

    if (socialLinks.length > 0) {
      await prisma.socialLink.createMany({
        data: socialLinks,
      });
    }
  }
}

async function main() {
  await seedEvents();
  await seedUsers();

  console.log(`Seeded ${TEST_USER_COUNT} test users.`);
  console.log(`QQ range: ${TEST_QQ_START} - ${TEST_QQ_START + TEST_USER_COUNT - 1}`);
  console.log("Default password: same as QQ.");
  console.log(`Active event id: ${ACTIVE_EVENT_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
