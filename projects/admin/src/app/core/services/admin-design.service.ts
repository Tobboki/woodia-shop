import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@admin-environments/environment';
import { Observable } from 'rxjs';
import {ProductModelConfig} from '@shared-types/product';

export interface ICategory {
  id: number;
  nameAr: string;
  nameEn: string;
  parentId: number | null;
  childCatogries: ICategory[] | null;
}

export interface ICategoryResponse {
  items: ICategory[];
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ICreateDesignDto {
  productLine: string;
  descriptionAr: string;
  descriptionEn: string;
  modelConfig: ProductModelConfig;
  productImage: { url: string; imagePlace: string }[];
  categoryId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDesignService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createDesign(dto: ICreateDesignDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/Product`, dto);
  }

  getCategories(): Observable<ICategoryResponse> {
    return this.http.get<ICategoryResponse>(`${this.apiUrl}/api/admin/Category`);
  }
}
