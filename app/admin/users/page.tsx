import Link from "next/link";
import { AdminForbidden, requireAdminForPage } from "@/app/admin/admin-access";
import AdminUsersClient from "@/app/admin/users/admin-users-client";
import { getAdminUsers } from "@/app/lib/admin-data";

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const user = await requireAdminForPage("/admin/users");

  if (!user) {
    return <AdminForbidden />;
  }

  const params = await searchParams;
  const data = await getAdminUsers({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
    search: getSearchParamValue(params.q),
  });

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">ComiLink Admin</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Users</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Import users and reset passwords.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              href="/admin"
            >
              Dashboard
            </Link>
          </div>
        </section>

        <AdminUsersClient
          currentUserId={user.id}
          key={`users-${data.search}-${data.pagination.page}-${data.pagination.pageSize}`}
          pagination={data.pagination}
          search={data.search}
          users={data.items}
        />
      </div>
    </main>
  );
}
