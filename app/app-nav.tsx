import Link from "next/link";
import { getCurrentUser } from "@/app/lib/auth";
import LogoutButton from "@/app/logout-button";

export default async function AppNav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex min-h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 py-2">
        <Link className="text-sm font-semibold text-zinc-950" href="/">
          ComiLink
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {user ? (
            <>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                href="/me"
              >
                我的资料
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                href="/me/collections"
              >
                Collections
              </Link>
              {user.isAdmin ? (
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  href="/admin"
                >
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </>
          ) : (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              href="/login"
            >
              登录
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
