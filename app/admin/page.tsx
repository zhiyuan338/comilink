import Link from "next/link";
import { AdminForbidden, requireAdminForPage } from "@/app/admin/admin-access";
import { getAdminDashboardStats } from "@/app/lib/admin-data";

export default async function AdminPage() {
  const user = await requireAdminForPage("/admin");

  if (!user) {
    return <AdminForbidden />;
  }

  const stats = await getAdminDashboardStats();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">ComiLink Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Signed in as {user.username}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Users</p>
            <p className="mt-2 text-2xl font-semibold">{stats.userCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-500">Events</p>
            <p className="mt-2 text-2xl font-semibold">{stats.eventCount}</p>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Current active event</h2>
          <p className="mt-2 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {stats.activeEvent?.name ?? "No active event"}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50"
            href="/admin/users"
          >
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Import users and reset passwords.
            </p>
          </Link>
          <Link
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50"
            href="/admin/events"
          >
            <h2 className="text-lg font-semibold">Events</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Create events and set the active event.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
