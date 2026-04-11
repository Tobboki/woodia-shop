import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@woodia-environments/environment';
import type { IJob, IJobsResponse } from '@woodia-types/job.types';
import {AuthService} from '@woodia-core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class JobService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  create(job: Partial<IJob>): Observable<IJob> {
    return this.http.post<IJob>(
      `${environment.apiUrl}${environment.endpoints.customer.job.create}`,
      job
    );
  }

  update(id: number, job: Partial<IJob>): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}${environment.endpoints.customer.job.update(id)}`,
      job
    );
  }

  getById(id: number): Observable<IJob> {
    return this.http.get<IJob>(
      `${environment.apiUrl}${environment.endpoints.customer.job.getById(id)}`
    );
  }

  getMyJobs(options?: {
    pageNumber?: number;
    pageSize?: number;
    searchValue?: string;
  }): Observable<IJobsResponse> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 10;
    const searchValue = options?.searchValue ?? "";

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('searchValue', searchValue);

    return this.http.get<IJobsResponse>(
      `${environment.apiUrl}${environment.endpoints.customer.job.myJobs}`,
      { params }
    );
  }

  markAsComplete(id: number): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}${environment.endpoints.customer.job.updateStatusComplete(id)}`,
      {}
    );
  }

  markAsCanceled(id: number): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}${environment.endpoints.customer.job.updateStatusCanceled(id)}`,
      {}
    );
  }

  markAsInProgress(id: number): Observable<void> {
    return this.http.patch<void>(
      `${environment.apiUrl}${environment.endpoints.customer.job.updateStatusInProgress(id)}`,
      {}
    );
  }
}
