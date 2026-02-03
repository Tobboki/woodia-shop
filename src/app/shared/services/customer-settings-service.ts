import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth';

export interface IEmailVerificationData {
  email: string;
  code: string
}

@Injectable({
  providedIn: 'root',
})
export class CustomerSettingsService {
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

  // ================================
  //            /Governorate (GET)
  // ================================
  getGovernorate(): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}${environment.endpoints.constants.governorate}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //            /me (GET)
  // ================================
  getMe(): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}/me`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //         /me/info (PUT)
  // ================================
  updateInfo(body: any): Observable<any> {
    return this.http
      .put(`${environment.apiUrl}/me/info`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //     /me/change-email (POST)
  // ================================
  changeEmail(body: { email: string }): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/me/change-email`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //     /me/resend-email (POST)
  // ================================
  resendEmailVerificationCode(email: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/me/resend-email`, email ?? {}, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //     /me/verify-email (POST)
  // ================================
  verifyEmail(verificationData: IEmailVerificationData): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/me/verify-email`, verificationData, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //     /me/contact-info (POST)
  // ================================
  createContactInfo(body: any): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/me/contact-info`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //   /me/contact-info/{Id} (GET)
  // ================================
  getContactInfo(): Observable<any> {
    return this.http
      .get(`${environment.apiUrl}${environment.endpoints.customer.settings.shipping.getShippingDetails}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // ================================
  //   /me/contact-info (PUT)
  // ================================
  updateContactInfo(body: any): Observable<any> {
    return this.http
      .put(`${environment.apiUrl}/me/contact-info`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }
}
