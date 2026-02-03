import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadButtonComponent } from './upload-button/upload-button.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, UploadButtonComponent],
  exports: [UploadButtonComponent],
})
export class SharedUiModule {}
