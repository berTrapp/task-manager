import { arrayMove } from "@dnd-kit/sortable";

export const CELL_ID_PREFIX = "cell:";

export function cellDroppableId(cellKey: string) {
  return `${CELL_ID_PREFIX}${cellKey}`;
}

function cellKeyFromDroppableId(id: string): string | null {
  return id.startsWith(CELL_ID_PREFIX) ? id.slice(CELL_ID_PREFIX.length) : null;
}

export type CellUpdate = { id: string; cellKey: string; position: number };

/**
 * Computes the new (cell, position) for every item affected by a drag from
 * `activeId` onto `overId`, given each item's current cell. `items` must
 * already be sorted by position within each cell (the visual order).
 *
 * Generic over what a "cell" means: a plain status column, or a composite
 * (assignee, status) swimlane cell — the caller decides via `cellKeyOf`.
 */
export function computeCellDrop<T extends { id: string }>(params: {
  items: T[];
  cellKeyOf: (item: T) => string;
  activeId: string;
  overId: string;
}): CellUpdate[] | null {
  const { items, cellKeyOf, activeId, overId } = params;
  if (activeId === overId) return null;

  const activeItem = items.find((i) => i.id === activeId);
  if (!activeItem) return null;

  const sourceKey = cellKeyOf(activeItem);
  const overCellKey = cellKeyFromDroppableId(overId);
  const overItem = overCellKey ? null : items.find((i) => i.id === overId);
  const destKey = overCellKey ?? (overItem ? cellKeyOf(overItem) : null);
  if (!destKey) return null;

  const idsInCell = (key: string) =>
    items.filter((i) => cellKeyOf(i) === key).map((i) => i.id);

  const sourceIds = idsInCell(sourceKey);
  const destIds = sourceKey === destKey ? sourceIds : idsInCell(destKey);
  const fromIndex = sourceIds.indexOf(activeId);
  if (fromIndex === -1) return null;

  let newSourceIds = sourceIds;
  let newDestIds: string[];

  if (sourceKey === destKey) {
    const overIndex = overCellKey ? destIds.length - 1 : destIds.indexOf(overId);
    newDestIds = arrayMove(destIds, fromIndex, overIndex === -1 ? destIds.length - 1 : overIndex);
  } else {
    newSourceIds = sourceIds.filter((id) => id !== activeId);
    const overIndex = overCellKey ? destIds.length : destIds.indexOf(overId);
    newDestIds = [...destIds];
    newDestIds.splice(overIndex === -1 ? destIds.length : overIndex, 0, activeId);
  }

  const updates: CellUpdate[] = newDestIds.map((id, position) => ({
    id,
    cellKey: destKey,
    position,
  }));
  if (sourceKey !== destKey) {
    newSourceIds.forEach((id, position) => updates.push({ id, cellKey: sourceKey, position }));
  }
  return updates;
}
