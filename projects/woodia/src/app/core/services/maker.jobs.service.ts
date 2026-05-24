import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@woodia-environments/environment';
import { IJob } from '@woodia-types/job.types';

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

export interface ISubmitOfferPayload {
  price: number;
  estimatedDays: number;
  message: string;
}

export interface IOffer {
  id: number;
  jobId: number;
  jobTitle?: string;
  price: number;
  estimatedDays: number;
  message: string;
  status: TOfferStatus;
  createdAt: string;
  job?: IJob;
}

export type TOfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

@Injectable({
  providedIn: 'root'
})
export class MakerJobsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAvailableJobs(params: IMakerJobsParams): Observable<IMakerJobsResponse> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber.toString())
      .set('pageSize', params.pageSize.toString());

    if (params.searchValue) {
      httpParams = httpParams.set('searchValue', params.searchValue);
    }

    return this.http.get<IMakerJobsResponse>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.available}`,
      { params: httpParams }
    );
  }

  getJobById(id: number): Observable<IJob> {
    return this.http.get<IJob>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.getById(id)}`
    );
  }

  submitOffer(jobId: number, payload: ISubmitOfferPayload): Observable<IOffer> {
    return this.http.post<IOffer>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.submitOffer(jobId)}`,
      payload
    );
  }

  getMyOffers(params?: { pageNumber?: number; pageSize?: number }): Observable<{ items: IOffer[]; totalCount: number }> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<{ items: IOffer[]; totalCount: number }>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.myOffers}`,
      { params: httpParams }
    );
  }

  getOfferDetails(id: number): Observable<IOffer> {
    return this.http.get<IOffer>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.offerDetails(id)}`
    );
  }

  withdrawOffer(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.withdrawOffer(id)}`
    );
  }
}