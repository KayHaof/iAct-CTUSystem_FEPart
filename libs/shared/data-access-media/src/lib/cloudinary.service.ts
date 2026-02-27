import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type CloudinaryFolder = 'activity' | 'avatar';

export interface CloudinaryUploadResponse {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  original_filename: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = 'dhjamvg6j';
  private uploadPreset = 'upload-iact';
  private basePath = 'iAct-CTU';
  private http = inject(HttpClient);

  uploadImage(file: File, folderType: CloudinaryFolder = 'activity'): Observable<string> {
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', `${this.basePath}/${folderType}`);

    return this.http
      .post<CloudinaryUploadResponse>(url, formData)
      .pipe(map((response) => response.secure_url));
  }
}