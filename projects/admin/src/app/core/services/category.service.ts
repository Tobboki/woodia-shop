import { HttpClient } from '@angular/common/http'
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

}
