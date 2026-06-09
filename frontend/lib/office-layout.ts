export const ROOM_HEIGHT = 76;
export const CONNECTOR_HEIGHT = 28;
export const STEP = ROOM_HEIGHT + CONNECTOR_HEIGHT;
export const RECEPTION_HEIGHT = 64;
export const RECEPTION_Y = 8;
export const OFFICE_BASE = RECEPTION_HEIGHT + CONNECTOR_HEIGHT + 48;
export const CORRIDOR_WIDTH = 72;

export const PATH_TRANSITION = {
  type: "spring" as const,
  stiffness: 68,
  damping: 17,
  mass: 1.1,
};

/** Vertical offset to center the corridor walker (xl character ≈ 80px) */
const WALKER_CENTER_OFFSET = 28;

export function getRoomCenterY(roomIndex: number): number {
  if (roomIndex < 0) {
    return RECEPTION_Y + RECEPTION_HEIGHT / 2 - WALKER_CENTER_OFFSET;
  }
  return (
    OFFICE_BASE + roomIndex * STEP + ROOM_HEIGHT / 2 - WALKER_CENTER_OFFSET
  );
}

export function getRoomTopY(roomIndex: number): number {
  if (roomIndex < 0) return RECEPTION_Y;
  return OFFICE_BASE + roomIndex * STEP;
}

export function getTotalFloorHeight(roomCount: number): number {
  return OFFICE_BASE + roomCount * STEP + 12;
}
