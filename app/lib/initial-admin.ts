import { hashPassword } from "@/app/lib/password";
import { prisma } from "@/app/lib/prisma";
import { generateUniqueUserToken } from "@/app/lib/user-token";

const globalForInitialAdmin = globalThis as unknown as {
  initialAdminPromise?: Promise<void>;
};

async function tokenExists(token: string) {
  const user = await prisma.user.findUnique({
    where: { token },
    select: { id: true },
  });

  return Boolean(user);
}

async function createInitialAdmin() {
  const qq = process.env.INITIAL_ADMIN_QQ?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!qq || !password) {
    return;
  }

  if (!/^\d{5,20}$/.test(qq)) {
    console.warn("INITIAL_ADMIN_QQ must be 5 to 20 digits.");
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });

  if (existingAdmin) {
    return;
  }

  const passwordHash = await hashPassword(password);
  const existingUser = await prisma.user.findUnique({
    where: { qq },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        isAdmin: true,
        isDisabled: false,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      qq,
      username: "InitialAdmin",
      passwordHash,
      token: await generateUniqueUserToken(tokenExists),
      isAdmin: true,
      isDisabled: false,
    },
  });
}

export async function ensureInitialAdmin() {
  if (!globalForInitialAdmin.initialAdminPromise) {
    globalForInitialAdmin.initialAdminPromise = createInitialAdmin();
  }

  await globalForInitialAdmin.initialAdminPromise;
}
