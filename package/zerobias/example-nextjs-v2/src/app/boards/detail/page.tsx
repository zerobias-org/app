"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { BoardDetail } from "./BoardDetail";

/**
 * `/boards/detail?id=…` — query-param route for the static-export reason documented in
 * tasks/detail/page.tsx. `useSearchParams` must sit under a Suspense boundary.
 */
export default function BoardDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="state loading-line">
          <Spinner diameter={18} /> Loading board…
        </p>
      }
    >
      <BoardDetail />
    </Suspense>
  );
}
