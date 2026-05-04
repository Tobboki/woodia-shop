import { ProductModelConfig } from '@shared-types/product';

export type TProductLine = 'OriginalClassic' | 'OriginalModern' | 'Edge' | 'Tone';

export interface ICreateDesignDto {
  productLine: TProductLine;
  descriptionAr: string;
  descriptionEn: string;
  modelConfig: ProductModelConfig;
  productImage: { url: string; imagePlace: string }[];
  categoryId: number;
}
