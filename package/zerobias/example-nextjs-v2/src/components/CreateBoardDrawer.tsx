"use client";

import type { UUID } from "@zerobias-org/types-core-js";
import { Drawer } from "@/components/Drawer";
import { CreateBoardForm } from "@/components/CreateBoardForm";

/**
 * CreateBoardDrawer — the Drawer + CreateBoardForm, shared by the boards list ("+ Create Board",
 * standalone) and the project detail header ("+ Create Board", pre-filled with that project's id).
 * The only thing that varies is `project`: absent = a standalone board; present = a board placed in
 * that project (its id flows into `NewBoard.projectId`).
 */
export function CreateBoardDrawer({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, place the board in this project. */
  project?: { id: UUID; name: string };
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Create board">
      {project && (
        <p className="drawer-context">
          in <strong>{project.name}</strong>
        </p>
      )}
      <CreateBoardForm projectId={project?.id} />
    </Drawer>
  );
}
