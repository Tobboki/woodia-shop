import { BookcaseModelConfig, DeskModelConfig, TvStandModelConfig, ShoeRackModelConfig, BedsideTableModelConfig } from '@shared-types/product';

export type TJobStatus = 'Pending' | 'InProgress' | 'Completed' | 'Canceled';

export interface IJob {
  id: number;
  title: string;
  description: string;
  status: TJobStatus;
  createdAt: string;
  expectedBudget: number | null;
  deliveryDay: number;
  productId: number;
  categoryId: number;
  categoryName?: string;
  modelConfig: BookcaseModelConfig | DeskModelConfig | TvStandModelConfig | ShoeRackModelConfig | BedsideTableModelConfig;
  images?: string[];
}

export interface IJobsResponse {
  items: IJob[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
