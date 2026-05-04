export type TProductLine = 'OriginalClassic' | 'OriginalModern' | 'Edge' | 'Tone';

export type TImagePlace = 'Thumbnail' | 'Hover' | 'Gallery';

export interface IProductImageDto {
  url: string;
  imagePlace: TImagePlace;
}

export interface ICreateDesignDto {
  productLine: TProductLine;
  descriptionAr: string;
  descriptionEn: string;
  modelConfig: any;
  productImage: IProductImageDto[];
  categoryId: number;
}
