import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@woodia-environments/environment';
import { AuthService } from './auth.service';

export interface IGovernorate {
  id: number;
  name: string;
  nameAr: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConstantsService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private get headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authService.getToken()}`,
        'Content-Type': 'application/json',
      }),
    };
  }

  getGovernorates(): Observable<IGovernorate[]> {
    return this.http
      .get<IGovernorate[]>(`${environment.apiUrl}${environment.endpoints.constants.governorate}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }
}
