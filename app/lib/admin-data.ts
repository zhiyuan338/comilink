import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";

export type AdminListQuery = {
  page?: number | string | null;
  pageSize?: number | string | null;
  search?: string | null;
};

export type AdminPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type AdminUserListItem = Awaited<
  ReturnType<typeof getAdminUsers>
>["items"][number];

export type AdminEventListItem = Awaited<
  ReturnType<typeof getAdminEvents>
>["items"][number];

function parseNumber(value: number | string | null | undefined) {
  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function normalizePageSize(value: number | string | null | undefined) {
  const parsed = parseNumber(value);

  if (!parsed) {
    return 10;
  }

  return Math.min(20, Math.max(10, parsed));
}

function normalizePage(value: number | string | null | undefined) {
  const parsed = parseNumber(value);

  if (!parsed || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizeSearch(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue || "";
}

function buildPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

export async function getAdminUsers(query: AdminListQuery = {}) {
  const search = normalizeSearch(query.search);
  const pageSize = normalizePageSize(query.pageSize);
  const requestedPage = normalizePage(query.page);
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { qq: { contains: search } },
          { username: { contains: search } },
        ],
      }
    : {};
  const total = await prisma.user.count({ where });
  const pagination = buildPagination(total, requestedPage, pageSize);
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: {
      id: true,
      qq: true,
      username: true,
      token: true,
      isAdmin: true,
      isDisabled: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    message: "Users loaded.",
    items: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    pagination,
    search,
  };
}

export async function getAdminEvents(query: AdminListQuery = {}) {
  const search = normalizeSearch(query.search);
  const pageSize = normalizePageSize(query.pageSize);
  const requestedPage = normalizePage(query.page);
  const where: Prisma.EventWhereInput = search
    ? { name: { contains: search } }
    : {};
  const total = await prisma.event.count({ where });
  const pagination = buildPagination(total, requestedPage, pageSize);
  const events = await prisma.event.findMany({
    where,
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
    },
  });

  return {
    success: true,
    message: "Events loaded.",
    items: events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
    pagination,
    search,
  };
}

export async function getAdminDashboardStats() {
  const [userCount, eventCount, activeEvent] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.event.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    userCount,
    eventCount,
    activeEvent,
  };
}
