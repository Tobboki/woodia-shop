import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@woodia-environments/environment';

export interface IPortfolioItem {
  id: number;
  title: string;
  description: string;
  portfolioImageUrls: string[];
  createdAt?: string;
}

export interface IAddPortfolioItemPayload {
  title: string;
  description: string;
  portfolioImageUrls: string[];
}

export interface IUpdatePortfolioItemPayload {
  title: string;
  description: string;
  portfolioImageUrls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MakerPortfolioService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPortfolioItems(): Observable<IPortfolioItem[]> {
    return this.http.get<any>(
      `${this.baseUrl}${environment.endpoints.maker.profile.portfolioItems}`
    ).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res?.items && Array.isArray(res.items)) return res.items;
        return [];
      })
    );
  }

  addPortfolioItem(payload: IAddPortfolioItemPayload): Observable<IPortfolioItem> {
    return this.http.post<IPortfolioItem>(
      `${this.baseUrl}${environment.endpoints.maker.profile.portfolio}`,
      payload
    );
  }

  updatePortfolioItem(id: number, payload: IUpdatePortfolioItemPayload): Observable<IPortfolioItem | null> {
    return this.http.put<IPortfolioItem>(
      `${this.baseUrl}${environment.endpoints.maker.profile.portfolio}/${id}`,
      payload
    );
  }

  deletePortfolioItem(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${environment.endpoints.maker.profile.portfolio}/${id}`
    );
  }
}