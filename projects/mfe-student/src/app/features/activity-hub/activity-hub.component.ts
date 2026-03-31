import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PaginationComponent } from '@my-mfe/ui';
import { ActivityService } from '../../shared/services/activity.service';
import { Activity } from '../../shared/models/activity.model';
import { PageDTO } from 'interface';

@Component({
  selector: 'app-activity-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './activity-hub.component.html',
  styleUrls: ['./activity-hub.component.scss'],
})
export class ActivityHubComponent implements OnInit {
  private activityService = inject(ActivityService);
  private router = inject(Router);

  // --- STATE MANAGEMENT ---
  activities = signal<Activity[]>([]);
  isLoading = signal<boolean>(false);

  // Filter States
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('ALL');
  selectedLevel = signal<string>('ALL');

  // Pagination States
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);
  totalRows = signal<number>(0);
  totalPage = signal<number>(0);

  ngOnInit(): void {
    this.fetchActivities();
  }

  // --- CORE LOGIC: GỌI API ---
  fetchActivities(): void {
    this.isLoading.set(true);

    this.activityService
      .getAllActivities(
        this.searchQuery().trim(),
        this.selectedLevel(),
        this.selectedStatus(),
        this.currentPage(),
        this.pageSize(),
      )
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: PageDTO<Activity>) => {
          this.activities.set(response.data || []);
          this.totalRows.set(response.totalRows || 0);
          this.totalPage.set(response.totalPage || 0);
        },
        error: (err) => console.error('Lỗi khi tải hoạt động:', err),
      });
  }

  // --- EVENT HANDLERS (Triggers) ---
  onSearchChange(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  setFilterStatus(status: string) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  setFilterLevel(level: string) {
    this.selectedLevel.set(level);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.fetchActivities();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.fetchActivities();
  }

  viewDetails(id: number) {
    this.router.navigate(['/activity-hub/detail', id]).then();
  }

  // --- UI HELPERS ---
  getCapacityPercentage(current = 0, max = 1): number {
    if (!max || max === 0) return 0;
    return Math.min(Math.round((current / max) * 100), 100);
  }

  getActivityStatus(act: Activity): { label: string; colorClass: string; dotClass: string } {
    const now = new Date().getTime();
    const regStart = new Date(act.registrationStart).getTime();
    const regEnd = new Date(act.registrationEnd).getTime();
    const isFull = (act.registeredCount || 0) >= act.maxParticipants;

    if (now > regEnd)
      return { label: 'Đã đóng đăng ký', colorClass: 'text-slate-500', dotClass: 'bg-slate-400' };
    if (isFull)
      return { label: 'Đã đủ số lượng', colorClass: 'text-red-600', dotClass: 'bg-red-500' };
    if (now < regStart)
      return { label: 'Sắp mở đăng ký', colorClass: 'text-amber-500', dotClass: 'bg-amber-400' };
    return { label: 'Đang mở đăng ký', colorClass: 'text-emerald-600', dotClass: 'bg-emerald-500' };
  }
}
