"use client";

import type { UUID } from "@zerobias-org/types-core-js";
import { Drawer } from "@/components/Drawer";
import { CreateTaskForm } from "@/components/CreateTaskForm";

/**
 * CreateTaskDrawer — the Drawer + CreateTaskForm, shared by the tasks list ("+ Create Task",
 * standalone) and the board detail header ("+ Create Task", pre-filled with that board's id and a
 * seed `activityId` from one of the board's tasks). `board` present => the task is created on that
 * board (`NewTask.boardId`); `activityId` seeds the required activity field.
 */
export function CreateTaskDrawer({
  open,
  onClose,
  board,
  activityId,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, create the task on this board. */
  board?: { id: UUID; name: string };
  /** A seed for the required activityId (e.g. taken from an existing task on the board). */
  activityId?: UUID;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Create task">
      {board && (
        <p className="drawer-context">
          on <strong>{board.name}</strong>
        </p>
      )}
      <CreateTaskForm boardId={board?.id} activityId={activityId} />
    </Drawer>
  );
}
