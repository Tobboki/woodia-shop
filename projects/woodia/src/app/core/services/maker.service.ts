import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, throwError, of, map } from 'rxjs';
import { environment } from '@woodia-environments/environment';
import { AuthService } from './auth.service';

export interface IMakerProfile {
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string | null;
}

export interface IProfessionalProfile {
  hourlyRate: number;
  profileOverview: string | null;
  profileImageUrl: string | null;
}

export interface IContactInfo {
  phoneNumber: string | null;
  addressLine: string | null;
  additionalInfo: string | null;
  governateId: number;
}

@Injectable({
  providedIn: 'root',
})
export class MakerService {
  readonly profileCompleted = signal<boolean | null>(null);

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

  // Basic Account Info
  getMe(): Observable<IMakerProfile> {
    return this.http
      .get<IMakerProfile>(`${environment.apiUrl}${environment.endpoints.maker.me}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  updateBasicInfo(body: { firstName: string; lastName: string }): Observable<any> {
    return this.http
      .put(`${environment.apiUrl}${environment.endpoints.maker.info}`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Professional Profile
  getProfessionalProfile(): Observable<IProfessionalProfile> {
    return this.http
      .get<IProfessionalProfile>(`${environment.apiUrl}${environment.endpoints.maker.profile.professional}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  createProfessionalProfile(body: IProfessionalProfile): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}${environment.endpoints.maker.profile.professional}`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  updateProfessionalProfile(body: IProfessionalProfile): Observable<any> {
    return this.http
      .put(`${environment.apiUrl}${environment.endpoints.maker.profile.professional}`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Contact Info
  getContactInfo(): Observable<IContactInfo> {
    return this.http
      .get<IContactInfo>(`${environment.apiUrl}${environment.endpoints.customer.settings.shipping.getShippingDetails}`, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  createContactInfo(body: IContactInfo): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}${environment.endpoints.customer.settings.shipping.createShippingDetails}`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  updateContactInfo(body: IContactInfo): Observable<any> {
    return this.http
      .put(`${environment.apiUrl}${environment.endpoints.customer.settings.shipping.updateShippingDetails}`, body, this.headers)
      .pipe(catchError(err => throwError(() => err)));
  }

  // Check if profile is completed
  // We'll consider it completed if they have professional profile and contact info
  isProfileCompleted(): Observable<boolean> {
    if (this.profileCompleted() !== null) {
      return of(this.profileCompleted()!);
    }

    return this.getProfessionalProfile().pipe(
      map(profile => {
        const isComplete = !!profile && !!profile.profileOverview && profile.hourlyRate > 0;
        this.profileCompleted.set(isComplete);
        return isComplete;
      }),
      catchError(() => {
        this.profileCompleted.set(false);
        return of(false);
      })
    );
  }
}
