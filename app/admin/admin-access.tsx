import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth";

export async function requireAdminForPage(returnTo: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return user.isAdmin ? user : null;
}

export function AdminForbidden() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950">
      <section className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">ComiLink Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Forbidden</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Your account does not have admin access.
        </p>
        <Link
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          href="/me"
        >
          Back to profile
        </Link>
      </section>
    </main>
  );
}
