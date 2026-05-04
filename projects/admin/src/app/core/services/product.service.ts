import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@admin-environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(req: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', req.pageNumber.toString())
      .set('PageSize', req.pageSize.toString());
      
    if (req.searchValue) {
      params = params.set('SearchValue', req.searchValue);
    }
    
    return this.http.get<any>(`${environment.apiUrl}${environment.endpoints.product.getAll}`, { params });
  }

  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}${environment.endpoints.product.getOne(id)}`);
  }

  createProduct(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}${environment.endpoints.product.create}`, data);
  }

  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}${environment.endpoints.product.update(id)}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${environment.endpoints.product.delete(id)}`);
  }

  updateProductStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}${environment.endpoints.product.updateStatus(id)}`, { status });
  }
}
