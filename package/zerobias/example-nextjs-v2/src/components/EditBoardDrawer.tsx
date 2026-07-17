"use client";

import type { BoardExtended } from "@zerobias-com/portal-sdk";
import { Drawer } from "@/components/Drawer";
import { EditBoardForm } from "@/components/EditBoardForm";

/**
 * EditBoardDrawer — the Drawer + EditBoardForm, opened from the "Edit" button on board detail. The
 * form is seeded from the record you're viewing, so `board` carries the current values; the reveal
 * then shows the delta against them.
 */
export function EditBoardDrawer({
  board,
  open,
  onClose,
}: {
  board: BoardExtended;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Edit board">
      <p className="drawer-context">
        <strong>{board.name}</strong>
      </p>
      <EditBoardForm board={board} />
    </Drawer>
  );
}
