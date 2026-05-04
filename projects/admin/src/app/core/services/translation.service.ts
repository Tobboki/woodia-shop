import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@admin-environments/environment';

export interface TranslationRequest {
  text: string;
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);

  translate(text: string) {
    return this.http.post<string>(`${environment.apiUrl}${environment.endpoints.translation}`, { text });
  }
}
