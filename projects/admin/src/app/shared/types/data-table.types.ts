export type TTableDensity = 'default' | 'compact' | 'comfortable'
export type TThemeMode = 'system' | 'light' | 'dark'

export interface ITableHeader {
  key: string
  title: string
  sortable?: boolean
}

export interface IGeneralResponse {
  items: any[]
  pageNumber: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}