"use client";

import type { ProjectExtended } from "@zerobias-com/portal-sdk";
import { Drawer } from "@/components/Drawer";
import { EditProjectForm } from "@/components/EditProjectForm";

/**
 * EditProjectDrawer — the Drawer + EditProjectForm, opened from the "Edit" button on project
 * detail. The form is seeded from the record you're viewing, so `project` carries the current
 * values; the reveal then shows the delta against them.
 */
export function EditProjectDrawer({
  project,
  open,
  onClose,
}: {
  project: ProjectExtended;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Edit project">
      <p className="drawer-context">
        <strong>{project.name}</strong>
      </p>
      <EditProjectForm project={project} />
    </Drawer>
  );
}
