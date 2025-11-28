import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.development';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthService } from './auth';


@Injectable({
  providedIn: 'root',
})
export class CustomerSettingsService {
  constructor(
    private http: HttpClient, 
    // private router: Router,
    private authService: AuthService
  ) {}

  me(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}${environment.endpoints.customer.me}`,
      {},
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.authService.getToken()}`,
          'Content-Type': 'application/json',
        }),
      }
    ).pipe(
      tap(response => {
        // You can log the response here if you need to inspect it
        console.log('User data:', response);
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }
}
