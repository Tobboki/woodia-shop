export interface ICategory {
  id: number;
  nameAr: string;
  nameEn: string;
  parentId: number | null;
  childCatogries: ICategory[] | null;
}

export interface ICategoryResponse {
  items: ICategory[];
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
