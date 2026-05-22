"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminPagination,
  AdminUserListItem,
} from "@/app/lib/admin-data";

type AdminUsersClientProps = {
  currentUserId: string;
  pagination: AdminPagination;
  search: string;
  users: AdminUserListItem[];
};

type OperationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  created?: number;
  skipped?: number;
  errors?: Array<{
    line: number;
    message: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getResponseMessage(data: OperationResponse, fallback: string) {
  return data.message || data.error || fallback;
}

export default function AdminUsersClient({
  currentUserId,
  pagination,
  search,
  users,
}: AdminUsersClientProps) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const selectedCount = selectedUserIds.length;

  function buildPageHref(page: number) {
    const params = new URLSearchParams();

    if (search) {
      params.set("q", search);
    }

    params.set("page", String(page));
    params.set("pageSize", String(pagination.pageSize));

    return `/admin/users?${params.toString()}`;
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function selectAllUsers() {
    setSelectedUserIds(users.map((user) => user.id));
  }

  async function runOperation(
    key: string,
    url: string,
    options: RequestInit,
    fallbackMessage: string,
  ) {
    setBusyKey(key);
    setStatus(null);

    try {
      const response = await fetch(url, options);
      const data = (await response.json()) as OperationResponse;

      setStatus(getResponseMessage(data, fallbackMessage));

      if (response.ok) {
        router.refresh();
      }
    } catch {
      setStatus(fallbackMessage);
    } finally {
      setBusyKey(null);
    }
  }

  async function importUsers() {
    setIsImporting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/users/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csv }),
      });
      const data = (await response.json()) as OperationResponse;

      if (!response.ok) {
        setStatus(getResponseMessage(data, "Import failed."));
        return;
      }

      const errorSummary =
        data.errors && data.errors.length > 0
          ? ` ${data.errors.length} row error(s).`
          : "";
      setStatus(`${getResponseMessage(data, "Import complete.")}${errorSummary}`);
      setCsv("");
      router.refresh();
    } catch {
      setStatus("Import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  async function resetPassword(userId: string) {
    await runOperation(
      `reset:${userId}`,
      `/api/admin/users/${encodeURIComponent(userId)}/reset-password`,
      { method: "POST" },
      "Password reset failed.",
    );
  }

  async function updateAdmin(userId: string, isAdmin: boolean) {
    await runOperation(
      `admin:${userId}`,
      `/api/admin/users/${encodeURIComponent(userId)}/admin`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin }),
      },
      "Admin update failed.",
    );
  }

  async function updateStatus(userId: string, isDisabled: boolean) {
    await runOperation(
      `status:${userId}`,
      `/api/admin/users/${encodeURIComponent(userId)}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDisabled }),
      },
      "User status update failed.",
    );
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    await runOperation(
      `delete:${userId}`,
      `/api/admin/users/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
      "User deletion failed.",
    );
    setSelectedUserIds((current) => current.filter((id) => id !== userId));
  }

  async function bulkStatus(action: "disable" | "enable") {
    await runOperation(
      `bulk:${action}`,
      "/api/admin/users/bulk",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedUserIds, action }),
      },
      "Bulk user update failed.",
    );
  }

  async function bulkDelete() {
    if (!window.confirm(`Delete ${selectedCount} selected user(s)?`)) {
      return;
    }

    await runOperation(
      "bulk:delete",
      "/api/admin/users/bulk",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedUserIds }),
      },
      "Bulk user deletion failed.",
    );
    setSelectedUserIds([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Import users</h2>
        <div className="mt-4 grid gap-3">
          <textarea
            className="min-h-36 rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm text-zinc-950"
            onChange={(event) => setCsv(event.target.value)}
            placeholder={"qq,username,password\n100000011,TestUser11,100000011"}
            value={csv}
          />
          <div className="flex justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isImporting}
              onClick={importUsers}
              type="button"
            >
              {isImporting ? "Importing..." : "Import CSV"}
            </button>
          </div>
        </div>
        {status ? (
          <p className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {status}
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <form
          action="/admin/users"
          className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Search
            <input
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
              defaultValue={search}
              name="q"
              placeholder="QQ or username"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Page size
            <select
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
              defaultValue={pagination.pageSize}
              name="pageSize"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              type="submit"
            >
              Search
            </button>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              href="/admin/users"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {pagination.total}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
              onClick={selectAllUsers}
              type="button"
            >
              Select all
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
              onClick={() => setSelectedUserIds([])}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        {selectedCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md bg-zinc-50 p-3">
            <span className="text-sm text-zinc-600">
              {selectedCount} selected
            </span>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(busyKey)}
              onClick={() => bulkStatus("disable")}
              type="button"
            >
              Disable selected
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(busyKey)}
              onClick={() => bulkStatus("enable")}
              type="button"
            >
              Enable selected
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(busyKey)}
              onClick={bulkDelete}
              type="button"
            >
              Delete selected
            </button>
          </div>
        ) : null}

        {users.length === 0 ? (
          <p className="mt-4 rounded-md bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
            No users yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;

              return (
                <article
                  className="rounded-md border border-zinc-200 p-3"
                  key={user.id}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <label className="flex items-start gap-3">
                        <input
                          checked={selectedUserIds.includes(user.id)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300"
                          onChange={() => toggleUser(user.id)}
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-zinc-950">
                              {user.username}
                            </span>
                            {user.isAdmin ? (
                              <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">
                                admin
                              </span>
                            ) : null}
                            {user.isDisabled ? (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                                disabled
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1 block text-sm text-zinc-500">
                            QQ {user.qq}
                          </span>
                          <span className="mt-1 block break-all font-mono text-xs text-zinc-500">
                            token {user.token}
                          </span>
                          <span className="mt-2 block text-xs text-zinc-500">
                            Created {formatDate(user.createdAt)}
                          </span>
                        </span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyKey === `reset:${user.id}`}
                        onClick={() => resetPassword(user.id)}
                        type="button"
                      >
                        {busyKey === `reset:${user.id}` ? "Resetting..." : "Reset password"}
                      </button>
                      <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyKey === `admin:${user.id}` || (isSelf && user.isAdmin)}
                        onClick={() => updateAdmin(user.id, !user.isAdmin)}
                        type="button"
                      >
                        {user.isAdmin ? "Cancel admin" : "Make admin"}
                      </button>
                      <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyKey === `status:${user.id}` || isSelf}
                        onClick={() => updateStatus(user.id, !user.isDisabled)}
                        type="button"
                      >
                        {user.isDisabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busyKey === `delete:${user.id}` || isSelf}
                        onClick={() => deleteUser(user.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            Page {pagination.page} of {pagination.totalPages}, {pagination.total} total
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              aria-disabled={!pagination.hasPreviousPage}
              className={`inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold ${
                pagination.hasPreviousPage
                  ? "text-zinc-800 transition hover:bg-zinc-50"
                  : "pointer-events-none text-zinc-400"
              }`}
              href={buildPageHref(Math.max(1, pagination.page - 1))}
            >
              Previous
            </Link>
            <Link
              aria-disabled={!pagination.hasNextPage}
              className={`inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold ${
                pagination.hasNextPage
                  ? "text-zinc-800 transition hover:bg-zinc-50"
                  : "pointer-events-none text-zinc-400"
              }`}
              href={buildPageHref(
                Math.min(pagination.totalPages, pagination.page + 1),
              )}
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
