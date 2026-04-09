import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { ICategory, ICategoryCard, IChildCategoryResponse } from '../../shared/types/category'
import { Observable } from 'rxjs'
import { environment } from '@woodia-environments/environment'

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<ICategory> {
    return this.http
      .get<ICategory>(`${environment.apiUrl}${environment.endpoints.customer.category.getAll}`)
  }

  getCategoryBySlug(slug: string): Observable<ICategoryCard[] | IChildCategoryResponse> {
    return this.http
      .get<ICategoryCard[] | IChildCategoryResponse>(`${environment.apiUrl}${environment.endpoints.customer.category.getBySlug(slug)}`)
  }
}
