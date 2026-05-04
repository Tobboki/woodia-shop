import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ICategoryResponse } from '@admin-types/category.types'
import { Observable } from 'rxjs'
import { environment } from '@admin-environments/environment'

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<ICategoryResponse> {
    return this.http
      .get<ICategoryResponse>(`${environment.apiUrl}${environment.endpoints.category.getAll}`)
  }

  getPagedCategories(req: any): Observable<any> {
    let params = new HttpParams()
      .set('PageNumber', req.pageNumber.toString())
      .set('PageSize', req.pageSize.toString());
      
    if (req.searchValue) {
      params = params.set('SearchValue', req.searchValue);
    }
    
    return this.http.get<any>(`${environment.apiUrl}${environment.endpoints.category.getAll}`, { params });
  }

  getParentCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}${environment.endpoints.category.getParents}`);
  }

  createCategory(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}${environment.endpoints.category.create}`, data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}${environment.endpoints.category.update(id)}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}${environment.endpoints.category.delete(id)}`);
  }
}
