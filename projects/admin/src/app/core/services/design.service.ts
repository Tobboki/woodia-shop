import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICreateDesignDto } from '@admin-types/design.types';
import { environment } from '@admin-environments/environment';
import { IProductCard } from '@shared-types/product';

@Injectable({
  providedIn: 'root',
})
export class DesignService {
  constructor(
    private http: HttpClient,
  ) { }

  createDesign(dto: ICreateDesignDto): Observable<any> {
    return this.http.post(`${environment.apiUrl}${environment.endpoints.product.create}`, dto);
  }

}
