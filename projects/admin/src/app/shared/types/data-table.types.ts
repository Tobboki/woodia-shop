export type TThemeMode = 'system' | 'light' | 'dark';
export type TTableDensity = 'default' | 'compact' | 'comfortable';

export interface ITableHeader {
  key: string;
  title: string;
  sortable?: boolean;
}

export interface IGeneralResponse {
  items: any[];
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface TableHeader {
  key: string;
  title: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface PagingConfig {
  pageSize: number;
  pageSizes: number[];
}

export interface QueryOptions {
  paging: boolean;
  search: boolean;
  sort: boolean;
}

export interface Operations {
  readSingle: boolean;
  add: boolean;
  update: boolean;
  delete: boolean;
}

export interface PagedRequest {
  pageNumber: number;
  pageSize: number;
  searchValue?: string;
}

export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}