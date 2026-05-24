import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@woodia-environments/environment';

export type TOfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface ISubmitOfferPayload {
  price: number;
  deliveryDay: number;
  description: string;
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
}

export interface IMyOffersResponse {
  items: IOffer[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MakerOfferService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  submitOffer(jobId: number, payload: ISubmitOfferPayload): Observable<IOffer> {
    return this.http.post<IOffer>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.submitOffer(jobId)}`,
      payload
    );
  }

  getMyOffers(params?: { pageNumber?: number; pageSize?: number }): Observable<IMyOffersResponse> {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.set('pageSize', params.pageSize.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.http.get<IMyOffersResponse>(
      `${this.baseUrl}${environment.endpoints.maker.jobs.myOffers}${qs}`
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