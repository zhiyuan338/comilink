"use client";

import { useEffect, useRef, useState } from "react";

type CollectStatus =
  | "idle"
  | "collected"
  | "already_collected"
  | "self_visit"
  | "not_logged_in"
  | "target_not_found"
  | "user_disabled"
  | "error";

type CollectResponse = {
  status?: CollectStatus;
  eventId?: string | null;
};

const collectMessages: Record<Exclude<CollectStatus, "idle">, string> = {
  collected: "Added to your collection.",
  already_collected: "Already in your collection.",
  self_visit: "This is your own page, so no collection was created.",
  not_logged_in: "Sign in to add this page to your collection.",
  target_not_found: "User not found.",
  user_disabled: "This user is not available.",
  error: "Collection failed. Please try again later.",
};

export function CollectStatusNotice({ targetToken }: { targetToken: string }) {
  const didCollect = useRef(false);
  const [status, setStatus] = useState<CollectStatus>("idle");

  useEffect(() => {
    if (didCollect.current) {
      return;
    }

    didCollect.current = true;

    async function collect() {
      try {
        const response = await fetch("/api/collections/collect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ targetToken }),
        });

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data = (await response.json()) as CollectResponse;
        setStatus(data.status || "error");
      } catch {
        setStatus("error");
      }
    }

    void collect();
  }, [targetToken]);

  if (status === "idle") {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm"
    >
      {collectMessages[status]}
    </section>
  );
}
