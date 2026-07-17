"use client";

import type { UUID } from "@zerobias-org/types-core-js";
import { Drawer } from "@/components/Drawer";
import { CreateProjectForm } from "@/components/CreateProjectForm";

/**
 * CreateProjectDrawer — the Drawer + CreateProjectForm, shared by the projects list ("+ Create
 * Project"), the project detail header ("+ Create Sub-Project"), and each node's "+" in the
 * structure panel. The only thing that varies is `parent`: absent = a top-level project; present
 * = a sub-project of that node (its id flows into `NewProject.parentId`).
 */
export function CreateProjectDrawer({
  open,
  onClose,
  parent,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, create a sub-project of this project. */
  parent?: { id: UUID; name: string };
}) {
  return (
    <Drawer open={open} onClose={onClose} title={parent ? "Create sub-project" : "Create project"}>
      {parent && (
        <p className="drawer-context">
          under <strong>{parent.name}</strong>
        </p>
      )}
      <CreateProjectForm parentId={parent?.id} />
    </Drawer>
  );
}
