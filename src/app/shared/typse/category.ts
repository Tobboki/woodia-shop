export interface IChildCategory {
  id: number
  name: string
  slug: string
}

export interface ICategory {
  id: number
  name: string
  slug: string
  childCategory: IChildCategory[]
}

export interface ICategoryCard {
  name: string
  slug: string
  imageUrl: string
}

export interface IChildCategoryResponse {
  name: string
  categoryChildNavigationResponses: ICategoryCard[]
}