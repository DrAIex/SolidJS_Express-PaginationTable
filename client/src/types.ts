export interface Item {
  id: number;
  value: string;
  selected?: boolean;
}

export interface PaginatedResponse {
  items: Item[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Settings {
  selectedIds: number[];
  customOrder: number[] | null;
} 