export type TJobStatus = 'pending' | 'inProgress' | 'completed' | 'canceled';

export interface IJob {
  id: number;
  title: string;
  description: string;
  status: TJobStatus
  createdAt: string;
}

export interface IJobsResponse {
  items: IJob[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
