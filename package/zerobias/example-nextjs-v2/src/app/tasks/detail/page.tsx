"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { TaskDetail } from "./TaskDetail";

/**
 * `/tasks/detail?id=…` — a single static page for task detail (see TaskDetail for why this is a
 * query param, not a `[id]` path segment). `useSearchParams` must sit under a Suspense boundary,
 * so the interactive component is wrapped here.
 */
export default function TaskDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="state loading-line">
          <Spinner diameter={18} /> Loading task…
        </p>
      }
    >
      <TaskDetail />
    </Suspense>
  );
}
