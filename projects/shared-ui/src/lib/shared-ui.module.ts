import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, UploadButtonComponent],
  exports: [UploadButtonComponent],
})
export class SharedUiModule {}
