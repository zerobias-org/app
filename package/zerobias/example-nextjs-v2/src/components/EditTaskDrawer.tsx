"use client";

import type { TaskExtended } from "@zerobias-com/portal-sdk";
import { Drawer } from "@/components/Drawer";
import { EditTaskForm } from "@/components/EditTaskForm";

/**
 * EditTaskDrawer — the Drawer + EditTaskForm, opened from the "Edit" button on task detail. The
 * form is seeded from the record you're viewing, so `task` carries the current values and its
 * `nextTransitions`; the reveal then shows the delta against them.
 */
export function EditTaskDrawer({
  task,
  open,
  onClose,
}: {
  task: TaskExtended;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Edit task">
      <p className="drawer-context">
        <span className="task-detail-code">{task.code}</span> <strong>{task.name}</strong>
      </p>
      <EditTaskForm task={task} />
    </Drawer>
  );
}
