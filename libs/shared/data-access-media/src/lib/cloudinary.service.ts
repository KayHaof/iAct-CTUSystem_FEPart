import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { provideCloudinaryLoader } from '@angular/common';

export const CLOUDINARY_CONFIG = {
  cloudName: 'dhjamvg6j',
  uploadPreset: 'upload-iact',
  basePath: 'iAct-CTU',
  // URL dùng cho Angular Image Loader
  loaderBaseUrl: 'https://res.cloudinary.com/dhjamvg6j',
};

export function provideIActCloudinary() {
  return provideCloudinaryLoader(CLOUDINARY_CONFIG.loaderBaseUrl);
}

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
  private http = inject(HttpClient);

  uploadImage(file: File, folderType: CloudinaryFolder = 'activity'): Observable<string> {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', `${CLOUDINARY_CONFIG.basePath}/${folderType}`);

    return this.http
      .post<CloudinaryUploadResponse>(url, formData)
      .pipe(map((response) => response.secure_url));
  }
}
