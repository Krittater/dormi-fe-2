export const DEFAULT_PAGE_SIZE = 20;
export const ROOM_TYPES_PAGE_SIZE = 10;
export const DROPDOWN_LIMIT = 100;
export const ROOMS_FETCH_ALL_LIMIT = 1000;
export const SEARCH_DEBOUNCE_MS = 400;

export const PER_PAGE_OPTIONS = [10, 20, 50] as const;

export const CUT_OFF_DATE = 25;
export const ISSUE_DATE = 26;
export const DUE_DATE = 5;

export const DEFAULT_ELECTRICITY_CUTOFF = 1;
export const DEFAULT_WATER_CUTOFF = 5;

export const SKELETON_ROWS_DEFAULT = 5;
export const SKELETON_ROWS_ROOMS = 8;
export const SKELETON_ROWS_CARDS = 3;
export const SKELETON_ROWS_DASHBOARD = 3;

export const ALL = "all" as const;
export const NO_ROOM = "none" as const;
export const MANUAL = "MANUAL" as const;
export const ACTIVE = "active" as const;
export const INACTIVE = "inactive" as const;

export const VIEW_TABLE = "table" as const;
export const VIEW_GRID = "grid" as const;

export type FilterAll = typeof ALL;
