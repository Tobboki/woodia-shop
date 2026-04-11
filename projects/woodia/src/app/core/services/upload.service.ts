import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@woodia-environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private http: HttpClient) {}

  uploadFiles(files: File[]) {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('Files', file);
    });

    return this.http.post<string[]>(
      `${environment.apiUrl}${environment.endpoints.upload}`,
      formData
    );
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('Files', file); // 👈 same here

    return this.http.post<string[]>(
      `${environment.apiUrl}${environment.endpoints.upload}`,
      formData
    );
  }
}
