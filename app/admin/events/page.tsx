import Link from "next/link";
import { AdminForbidden, requireAdminForPage } from "@/app/admin/admin-access";
import AdminEventsClient from "@/app/admin/events/admin-events-client";
import { getAdminEvents } from "@/app/lib/admin-data";

type AdminEventsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    pageSize?: string | string[];
    q?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const user = await requireAdminForPage("/admin/events");

  if (!user) {
    return <AdminForbidden />;
  }

  const params = await searchParams;
  const data = await getAdminEvents({
    page: getSearchParamValue(params.page),
    pageSize: getSearchParamValue(params.pageSize),
    search: getSearchParamValue(params.q),
  });

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">ComiLink Admin</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Events</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Create events and set the active event.
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

        <AdminEventsClient
          events={data.items}
          key={`events-${data.search}-${data.pagination.page}-${data.pagination.pageSize}`}
          pagination={data.pagination}
          search={data.search}
        />
      </div>
    </main>
  );
}
