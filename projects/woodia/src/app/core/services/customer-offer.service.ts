import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@woodia-environments/environment';
import { ICustomerOffer, ICustomerOffersResponse } from '../../shared/types/offer.types';

export interface ICarpenterProfessionalProfile {
  id: number;
  hourlyRate: number;
  profileOverview: string;
  profileImageUrl: string | null;
}

export interface ICarpenterPortfolioItem {
  id: number;
  title: string;
  description: string;
  portfolioImageUrls: string[];
}

export interface ICarpenterProfile {
  firstName: string;
  lastName: string;
  photoUrl: string;
  professionalProfile: ICarpenterProfessionalProfile;
  portfolioItem: ICarpenterPortfolioItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomerOfferService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getJobOffers(jobId: number, params?: { pageNumber?: number; pageSize?: number }): Observable<ICustomerOffersResponse> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<ICustomerOffersResponse>(
      `${this.baseUrl}/api/client/jobs/${jobId}/offers`,
      { params: httpParams }
    );
  }

  getOfferDetails(jobId: number, offerId: number): Observable<ICustomerOffer> {
    return this.http.get<ICustomerOffer>(
      `${this.baseUrl}/api/client/jobs/${jobId}/offers/${offerId}`
    );
  }

  negotiateOffer(offerId: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(
      `${this.baseUrl}/api/jobs/${offerId}/negotiate`,
      {}
    );
  }

  getCarpenterProfile(carpenterId: string): Observable<ICarpenterProfile> {
    return this.http.get<ICarpenterProfile>(
      `${this.baseUrl}/api/carpenters/${carpenterId}/profile`
    );
  }
}