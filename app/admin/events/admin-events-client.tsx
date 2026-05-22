"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminEventListItem,
  AdminPagination,
} from "@/app/lib/admin-data";

type AdminEventsClientProps = {
  events: AdminEventListItem[];
  pagination: AdminPagination;
  search: string;
};

type OperationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
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

export default function AdminEventsClient({
  events,
  pagination,
  search,
}: AdminEventsClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const selectedCount = selectedEventIds.length;

  function buildPageHref(page: number) {
    const params = new URLSearchParams();

    if (search) {
      params.set("q", search);
    }

    params.set("page", String(page));
    params.set("pageSize", String(pagination.pageSize));

    return `/admin/events?${params.toString()}`;
  }

  function toggleEvent(eventId: string) {
    setSelectedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    );
  }

  async function createEvent() {
    setIsCreating(true);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });
      const data = (await response.json()) as OperationResponse;

      setStatus(getResponseMessage(data, "Event creation failed."));

      if (response.ok) {
        setName("");
        setDescription("");
        router.refresh();
      }
    } catch {
      setStatus("Event creation failed.");
    } finally {
      setIsCreating(false);
    }
  }

  async function activateEvent(eventId: string) {
    setBusyKey(`activate:${eventId}`);
    setStatus(null);

    try {
      const response = await fetch(
        `/api/admin/events/${encodeURIComponent(eventId)}/activate`,
        { method: "PUT" },
      );
      const data = (await response.json()) as OperationResponse;

      setStatus(getResponseMessage(data, "Event activation failed."));

      if (response.ok) {
        router.refresh();
      }
    } catch {
      setStatus("Event activation failed.");
    } finally {
      setBusyKey(null);
    }
  }

  async function bulkDeleteEvents() {
    if (!window.confirm(`Delete ${selectedCount} selected event(s)?`)) {
      return;
    }

    setBusyKey("bulk:delete");
    setStatus(null);

    try {
      const response = await fetch("/api/admin/events/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedEventIds }),
      });
      const data = (await response.json()) as OperationResponse;

      setStatus(getResponseMessage(data, "Bulk event deletion failed."));

      if (response.ok) {
        setSelectedEventIds([]);
        router.refresh();
      }
    } catch {
      setStatus("Bulk event deletion failed.");
    } finally {
      setBusyKey(null);
    }
  }

  async function activateSelectedEvent() {
    setBusyKey("bulk:activate");
    setStatus(null);

    try {
      const response = await fetch("/api/admin/events/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedEventIds, action: "activate" }),
      });
      const data = (await response.json()) as OperationResponse;

      setStatus(getResponseMessage(data, "Event activation failed."));

      if (response.ok) {
        setSelectedEventIds([]);
        router.refresh();
      }
    } catch {
      setStatus("Event activation failed.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Create event</h2>
        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Name
            <input
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Description
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-950"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>
          <div className="flex justify-end">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreating}
              onClick={createEvent}
              type="button"
            >
              {isCreating ? "Creating..." : "Create event"}
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
          action="/admin/events"
          className="grid gap-3 md:grid-cols-[1fr_auto_auto]"
        >
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Search
            <input
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950"
              defaultValue={search}
              name="q"
              placeholder="Event name"
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
              href="/admin/events"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Events</h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {pagination.total}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
              onClick={() => setSelectedEventIds(events.map((event) => event.id))}
              type="button"
            >
              Select all
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
              onClick={() => setSelectedEventIds([])}
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
              onClick={activateSelectedEvent}
              type="button"
            >
              Set selected active
            </button>
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={Boolean(busyKey)}
              onClick={bulkDeleteEvents}
              type="button"
            >
              Delete selected
            </button>
          </div>
        ) : null}

        {events.length === 0 ? (
          <p className="mt-4 rounded-md bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
            No events yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {events.map((event) => (
              <article
                className="rounded-md border border-zinc-200 p-3"
                key={event.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <label className="flex items-start gap-3">
                      <input
                        checked={selectedEventIds.includes(event.id)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300"
                        onChange={() => toggleEvent(event.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-zinc-950">
                            {event.name}
                          </span>
                          {event.isActive ? (
                            <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-xs font-medium text-white">
                              active
                            </span>
                          ) : null}
                        </span>
                        {event.description ? (
                          <span className="mt-1 block text-sm text-zinc-600">
                            {event.description}
                          </span>
                        ) : null}
                        <span className="mt-2 block text-xs text-zinc-500">
                          Created {formatDate(event.createdAt)}
                        </span>
                      </span>
                    </label>
                  </div>
                  <button
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={event.isActive || busyKey === `activate:${event.id}`}
                    onClick={() => activateEvent(event.id)}
                    type="button"
                  >
                    {busyKey === `activate:${event.id}` ? "Activating..." : "Set active"}
                  </button>
                </div>
              </article>
            ))}
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
