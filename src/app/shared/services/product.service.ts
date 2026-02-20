import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { environment } from 'src/environments/environment'
import type { Product } from '@core/furniture'

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}${environment.endpoints.product.getById(id)}`)
  }
}
