import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CloudinaryService } from '../../../../../data-access-media/src/lib/cloudinary.service';

@Component({
  selector: 'lib-upload-button',
  templateUrl: './upload-button.component.html',
  styleUrls: ['./upload-button.component.scss'],
})
export class UploadButtonComponent {
  @Input() label: string = 'Upload Ảnh';
  @Output() uploadSuccess = new EventEmitter<string>();

  isLoading = false;
  errorMessage = '';

  constructor(private cloudinary: CloudinaryService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.isLoading = true;
      this.errorMessage = '';

      this.cloudinary.uploadImage(file).subscribe({
        next: (url) => {
          this.isLoading = false;
          this.uploadSuccess.emit(url);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.errorMessage = 'Lỗi upload! Vui lòng thử lại.';
        },
      });
    }
  }
}
