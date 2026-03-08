import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { environment } from 'src/environments/environment'
import type { Product } from '@core/furniture'
import { IProductsResponse } from '@shared/types/product'

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Product> {
    return this.http
      .get<Product>(`${environment.apiUrl}${environment.endpoints.customer.product.getById(id)}`)
  }

  getAllProducts(
    options?: {
      pageNumber?: number;
      pageSize?: number;
      // searchQuery?: string;
    }
  ): Observable<IProductsResponse> {

    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 10;

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    // if (options?.searchQuery) {
    //   params = params.set('searchQuery', options.searchQuery);
    // }

    return this.http.get<IProductsResponse>(
      `${environment.apiUrl}${environment.endpoints.customer.product.getAll}`,
      { params }
    );
  }

  getProductCardsByCategorySlug(
    slug: string,
    options?: {
      pageNumber?: number;
      pageSize?: number;
      // searchQuery?: string;
    }
  ): Observable<IProductsResponse> {

    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 10;

    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    // if (options?.searchQuery) {
    //   params = params.set('searchQuery', options.searchQuery);
    // }

    console.log('used slug', slug)

    return this.http.get<IProductsResponse>(
      `${environment.apiUrl}${environment.endpoints.customer.product.getByCategorySlug(slug)}`,
      { params }
    );
  }
}
