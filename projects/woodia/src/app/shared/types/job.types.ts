import { BookcaseModelConfig, DeskModelConfig, TvStandModelConfig, ShoeRackModelConfig, BedsideTableModelConfig } from '@shared-types/product';

export type TJobStatus = | 'InProgress' | 'Completed' | 'Canceled' | 'Open';

export interface IJob {
  id: number;
  title: string;
  description: string;
  jobStatus: TJobStatus;
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

export interface IMakerJobsParams {
  pageNumber: number;
  pageSize: number;
  searchValue?: string;
}

export interface IMakerJobsResponse {
  items: IJob[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}


export interface IMakerJobDetail {
  id: number;
  title: string;
  description: string;
  deliveryDay: number;
  expectedBudget: number | null;
  categoryName: string;
  createdAt: string;
  modelConfig: BookcaseModelConfig | DeskModelConfig | TvStandModelConfig | ShoeRackModelConfig | BedsideTableModelConfig | any;
  jobClientBriefDto: {
    firstName: string;
    lastName: string;
    photoUrl: string;
    governorateName: string;
  };
}