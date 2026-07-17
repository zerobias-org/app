"use client";

import { Suspense } from "react";
import { Spinner } from "@/components/Spinner";
import { ProjectDetail } from "./ProjectDetail";

/**
 * `/projects/detail?id=…` — query-param route for the same static-export reason as task detail
 * (see tasks/detail/page.tsx). `useSearchParams` must sit under a Suspense boundary.
 */
export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="state loading-line">
          <Spinner diameter={18} /> Loading project…
        </p>
      }
    >
      <ProjectDetail />
    </Suspense>
  );
}
