import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, Location, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiResponse } from 'interface';

import {
  PaginationComponent,
  AlertService,
  ConfirmService,
  // PageHeaderComponent,
  TableContainerComponent,
} from '@my-mfe/ui';
import { CloudinaryPathPipe } from '@my-mfe/data-access-media';
import { ParticipantService } from '../services/participant.service';
import { RegistrationResponse } from 'interface';
import { PageDTO } from 'interface';

@Component({
  selector: 'app-participant-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    // PageHeaderComponent,
    TableContainerComponent,
    NgOptimizedImage,
    CloudinaryPathPipe, // Import pipe
  ],
  templateUrl: './participant-management.component.html',
})
export class ParticipantManagementComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private participantService = inject(ParticipantService);
  private alertService = inject(AlertService);
  private confirmService = inject(ConfirmService);

  activityId = signal<number | null>(null);

  // --- QUẢN LÝ TRẠNG THÁI ---
  searchQuery = signal('');
  currentTab = signal('ALL');
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(false);

  totalRows = signal(0);
  participants = signal<RegistrationResponse[]>([]);

  // --- QUẢN LÝ SORT CLIENT ---
  sortColumn = signal<keyof RegistrationResponse | ''>(''); // Cột đang sort
  sortDirection = signal<'asc' | 'desc'>('asc'); // Chiều sort

  private searchTimeout?: ReturnType<typeof setTimeout>;

  sortedParticipants = computed(() => {
    const data = [...this.participants()];
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    if (!col) return data;

    return data.sort((a, b) => {
      let valA: any = a[col];
      let valB: any = b[col];

      // Xử lý null/undefined
      if (!valA) valA = '';
      if (!valB) valB = '';

      // Xử lý chuỗi (Tên, MSSV)
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * dir;
      }

      // Xử lý Date/Number
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.activityId.set(Number(idParam));
      this.fetchParticipants();
    } else {
      this.alertService.error('Không tìm thấy mã hoạt động!');
      this.goBack();
    }
  }

  fetchParticipants(): void {
    const actId = this.activityId();
    if (!actId) return;

    this.isLoading.set(true);
    this.participantService
      .getParticipantsByActivity(
        actId,
        this.searchQuery(),
        this.currentTab(),
        this.currentPage(),
        this.pageSize(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<PageDTO<RegistrationResponse>>) => {
          const pageData = response.result;
          this.participants.set(pageData?.data || []);
          this.totalRows.set(pageData?.totalRows || 0);

          // Reset sort khi load data mới
          this.sortColumn.set('');
          this.sortDirection.set('asc');
        },
        error: (err: HttpErrorResponse) => {
          this.alertService.error(err.error?.message || 'Lỗi tải danh sách sinh viên!');
        },
      });
  }

  // --- ACTIONS ---
  goBack(): void {
    this.location.back();
  }

  onTabChange(tab: string): void {
    this.currentTab.set(tab);
    this.currentPage.set(1);
    this.fetchParticipants();
  }

  onSearch(keyword: string): void {
    this.searchQuery.set(keyword);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.fetchParticipants();
    }, 1000);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.fetchParticipants();
  }

  toggleSort(column: keyof RegistrationResponse): void {
    if (this.sortColumn() === column) {
      // Đang sort cột này -> đổi chiều
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Sort cột mới -> mặc định tăng dần
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  async changeStatus(id: number, newStatus: number, actionName: string): Promise<void> {
    const isConfirmed = await this.confirmService.confirm(
      `Xác nhận ${actionName}?`,
      `Bạn có chắc chắn muốn ${actionName.toLowerCase()} sinh viên này không?`,
      'Đồng ý',
      'Hủy',
    );

    if (isConfirmed) {
      this.isLoading.set(true);
      this.participantService
        .updateParticipantStatus(id, newStatus)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.alertService.success(`Đã ${actionName.toLowerCase()} thành công!`);
            this.fetchParticipants();
          },
          error: (err: HttpErrorResponse) =>
            this.alertService.error(err.error?.message || 'Có lỗi xảy ra!'),
        });
    }
  }

  getInitial(name: string): string {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }

  exportToExcel(): void {
    const actId = this.activityId();
    if (!actId) return;

    this.isLoading.set(true);
    this.participantService
      .exportExcel(actId, this.searchQuery(), this.currentTab())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          // 1. Tạo một URL ảo từ cục Blob tải về
          const downloadUrl = window.URL.createObjectURL(blob);
          // 2. Tạo một thẻ <a> ẩn
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `Danh_sach_Sinh_vien_${actId}.xlsx`; // Tên file mặc định
          // 3. Giả lập cú click để tải file
          link.click();
          // 4. Dọn dẹp bộ nhớ
          window.URL.revokeObjectURL(downloadUrl);

          this.alertService.success('Đã xuất file Excel thành công!');
        },
        error: () => {
          this.alertService.error('Có lỗi xảy ra khi tải file Excel!');
        }
      });
  }
}
