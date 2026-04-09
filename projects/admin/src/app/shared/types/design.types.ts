import {ProductModelConfig} from '@shared-types/product';

export interface ICreateDesignDto {
  productLine: string;
  descriptionAr: string;
  descriptionEn: string;
  modelConfig: ProductModelConfig;
  productImage: { url: string; imagePlace: string }[];
  categoryId: number;
}
