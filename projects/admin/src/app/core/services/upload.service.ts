import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@admin-environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);

  uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('Files', file));
    return this.http.post<string[]>(`${environment.apiUrl}${environment.endpoints.upload}`, formData);
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('Files', file);
    return this.http.post<string[]>(`${environment.apiUrl}${environment.endpoints.upload}`, formData);
  }
}
