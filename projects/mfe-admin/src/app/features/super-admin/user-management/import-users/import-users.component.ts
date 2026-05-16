import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { AdminUserService } from '../../services/admin-user.service';
import { AlertService } from '@my-mfe/ui';
import { ImportResultDto, ApiResponse } from 'interface';

@Component({
  selector: 'app-import-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-users.component.html',
  styleUrls: ['./import-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportUsersComponent {
  private router = inject(Router);
  private adminUserService = inject(AdminUserService);
  private alertService = inject(AlertService);

  // Trạng thái File
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  isUploading = signal(false);

  previewHeaders = signal<unknown[]>([]);
  previewRows = signal<unknown[][]>([]);

  // Kết quả trả về
  importResult = signal<ImportResultDto | null>(null);

  // 1. XỬ LÝ KÉO THẢ FILE
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    input.value = '';
  }

  // 2. ĐỌC FILE VÀ PREVIEW BẰNG XLSX
  handleFile(file: File) {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx')) {
      this.alertService.error('Vui lòng chọn file Excel chuẩn (.xlsx, .xls)');
      return;
    }

    this.selectedFile.set(file);
    this.importResult.set(null);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (result instanceof ArrayBuffer) {
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Đọc Sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          this.previewHeaders.set(jsonData[0] as unknown[]); // Dòng 1 làm Header
          this.previewRows.set(jsonData.slice(1, 6)); // Lấy max 5 dòng đầu làm Data Preview
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // 3. GỬI XUỐNG BACKEND
  uploadFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roleType', '1');

    this.adminUserService.importUsersFromExcel(formData).subscribe({
      next: (res: ApiResponse<ImportResultDto>) => {
        this.isUploading.set(false);
        if (res.result) {
          this.importResult.set(res.result);
          if (res.result.failCount === 0) {
            this.alertService.success('Import toàn bộ dữ liệu thành công!');
          } else {
            this.alertService.warning(
              `Thành công: ${res.result.successCount}, Lỗi: ${res.result.failCount}`,
            );
          }
        }
      },
      error: () => {
        this.isUploading.set(false);
        this.alertService.error('Có lỗi xảy ra khi xử lý file trên máy chủ.');
      },
    });
  }

  // 4. TẢI FILE LỖI VỀ MÁY
  downloadErrorFile() {
    const result = this.importResult();
    if (result && result.errorFileBase64) {
      const link = document.createElement('a');
      link.href =
        'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' +
        result.errorFileBase64;
      link.download = `Loi_Import_SinhVien_${new Date().getTime()}.xlsx`;
      link.click();
    }
  }

  goBack() {
    void this.router.navigate(['/admin/user-management']);
  }

  cancelSelection() {
    this.selectedFile.set(null);
    this.previewHeaders.set([]);
    this.previewRows.set([]);
    this.importResult.set(null);
  }
}
