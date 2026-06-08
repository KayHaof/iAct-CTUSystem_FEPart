import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SemesterService } from '../../shared/services/semester.service';
import { Semester, ApiResponse, PageDTO } from 'interface';

interface CategoryPoint {
  categoryId: number;
  categoryName: string;
  maxPoint: number;
  earnedPoint: number;
  children?: CategoryPoint[];
}

interface PointDetail {
  activityId: number;
  activityTitle: string;
  categoryId: number;
  categoryName: string;
  earnedPoint: number;
  awardedAt: string;
  proofStatus: number;
}

interface PointSummary {
  studentId: number;
  studentCode: string;
  studentName: string;
  semesterId: number;
  semesterName: string;
  totalPoint: number;
  maxPoint: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

interface PointDetailsResponse {
  categories: CategoryPoint[];
  details: PointDetail[];
}

@Component({
  selector: 'app-point-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Diem ren luyen</h1>
          <p class="text-slate-500 mt-1">Xem tong diem va chi tiet diem ren luyen theo tung tieu chi</p>
        </div>

        <!-- Semester Selector -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-slate-700">Hoc ky:</label>
            <select
              [value]="selectedSemesterId()"
              (change)="onSemesterChange($event)"
              class="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              @for (sem of semesters(); track sem.id) {
                <option [value]="sem.id">
                  {{ sem.semesterName }} ({{ sem.academicYear }})
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Summary Cards -->
        @if (summary()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Diem tong -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-slate-500 text-sm">Tong diem</span>
                <span class="text-xs font-medium px-2 py-1 rounded-full"
                  [class]="getStatusBadge(summary()!.status)">
                  {{ getStatusLabel(summary()!.status) }}
                </span>
              </div>
              <div class="text-3xl font-bold" [class]="getScoreColor(summary()!.percentage)">
                {{ summary()!.totalPoint }}
                <span class="text-lg text-slate-400 font-normal">/ {{ summary()!.maxPoint }}</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-slate-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all"
                    [class]="getProgressBarColor(summary()!.percentage)"
                    [style.width.%]="summary()!.percentage"
                  ></div>
                </div>
                <p class="text-xs text-slate-400 mt-1">{{ summary()!.percentage | number:'1.1-1' }}%</p>
              </div>
            </div>

            <!-- Thong tin SV -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <span class="text-slate-500 text-sm">Thong tin sinh vien</span>
              <div class="mt-3 space-y-2">
                <p class="text-slate-700">
                  <span class="font-medium">Ma SV:</span> {{ summary()!.studentCode }}
                </p>
                <p class="text-slate-700">
                  <span class="font-medium">Ten:</span> {{ summary()!.studentName }}
                </p>
                <p class="text-slate-700">
                  <span class="font-medium">Hoc ky:</span> {{ summary()!.semesterName }}
                </p>
              </div>
            </div>

            <!-- Chi so -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <span class="text-slate-500 text-sm">Chi so</span>
              <div class="mt-3">
                @if (summary()!.percentage >= 90) {
                  <div class="flex items-center gap-2 text-green-600">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-medium">Xuat sac!</span>
                  </div>
                } @else if (summary()!.percentage >= 70) {
                  <div class="flex items-center gap-2 text-blue-600">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-medium">Tot!</span>
                  </div>
                } @else if (summary()!.percentage >= 50) {
                  <div class="flex items-center gap-2 text-yellow-600">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span class="font-medium">Can co gang them!</span>
                  </div>
                } @else {
                  <div class="flex items-center gap-2 text-red-600">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-medium">Yeu!</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Loading -->
        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        }

        <!-- Categories Breakdown -->
        @if (!isLoading() && categories().length > 0) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Diem theo tieu chi</h2>
            <div class="space-y-4">
              @for (cat of categories(); track cat.categoryId) {
                <div class="border border-slate-100 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-slate-700">{{ cat.categoryName }}</span>
                    <span class="text-sm font-medium text-slate-600">
                      {{ cat.earnedPoint }} / {{ cat.maxPoint }} diem
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      [class]="getCatProgressColor(cat.earnedPoint, cat.maxPoint)"
                      [style.width.%]="cat.maxPoint > 0 ? (cat.earnedPoint / cat.maxPoint) * 100 : 0"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Activity Details -->
        @if (!isLoading() && details().length > 0) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 class="text-lg font-semibold text-slate-800 mb-4">Chi tiet diem theo hoat dong</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200">
                    <th class="text-left py-3 px-4 font-medium text-slate-600">Hoat dong</th>
                    <th class="text-left py-3 px-4 font-medium text-slate-600">Tieu chi</th>
                    <th class="text-center py-3 px-4 font-medium text-slate-600">Diem</th>
                    <th class="text-left py-3 px-4 font-medium text-slate-600">Ngay nhan</th>
                    <th class="text-center py-3 px-4 font-medium text-slate-600">Trang thai minh chung</th>
                  </tr>
                </thead>
                <tbody>
                  @for (detail of details(); track detail.activityId + '-' + detail.categoryId) {
                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                      <td class="py-3 px-4 text-slate-700">{{ detail.activityTitle }}</td>
                      <td class="py-3 px-4 text-slate-600">{{ detail.categoryName }}</td>
                      <td class="py-3 px-4 text-center font-medium text-blue-600">{{ detail.earnedPoint }}</td>
                      <td class="py-3 px-4 text-slate-500">{{ detail.awardedAt | date:'dd/MM/yyyy' }}</td>
                      <td class="py-3 px-4 text-center">
                        <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class]="getProofStatusClass(detail.proofStatus)">
                          {{ getProofStatusLabel(detail.proofStatus) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && !summary() && categories().length === 0) {
          <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <h3 class="text-lg font-medium text-slate-600 mb-2">Chua co diem ren luyen</h3>
            <p class="text-slate-400">Tham gia cac hoat dong de tich diem ren luyen nhe!</p>
            <a routerLink="/activity-hub"
              class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Tim hoat dong
            </a>
          </div>
        }
      </div>
    </div>
  `,
})
export class PointManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private semesterService = inject(SemesterService);
  private baseUrl = 'http://localhost:8080';

  summary = signal<PointSummary | null>(null);
  categories = signal<CategoryPoint[]>([]);
  details = signal<PointDetail[]>([]);
  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number>(0);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadSemesters();
  }

  loadSemesters(): void {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.semesters.set(list);
        const active = list.find((s: Semester) => s.isActive);
        if (active) {
          this.selectedSemesterId.set(active.id);
          this.loadPointData(active.id);
        } else if (list.length > 0) {
          this.selectedSemesterId.set(list[0].id);
          this.loadPointData(list[0].id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSemesterChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedSemesterId.set(id);
    this.loadPointData(id);
  }

  loadPointData(semesterId: number): void {
    this.isLoading.set(true);
    const apiUrl = `${this.baseUrl}/activity/api/v1`;

    this.http.get<ApiResponse<PointSummary>>(`${apiUrl}/student-points/summary`, {
      params: { semesterId: semesterId.toString() }
    }).subscribe({
      next: (res) => this.summary.set(res.data ?? null),
      error: () => this.summary.set(null),
    });

    this.http.get<ApiResponse<PointDetailsResponse>>(`${apiUrl}/student-points/details`, {
      params: { semesterId: semesterId.toString() }
    }).subscribe({
      next: (res) => {
        if (res.data) {
          this.categories.set(res.data.categories || []);
          this.details.set(res.data.details || []);
        }
      },
      error: () => {},
      complete: () => this.isLoading.set(false),
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-700';
      case 'good': return 'bg-blue-100 text-blue-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'danger': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'excellent': return 'Xuat sac';
      case 'good': return 'Tot';
      case 'warning': return 'Trung binh';
      case 'danger': return 'Yeu';
      default: return 'Khong xac dinh';
    }
  }

  getScoreColor(pct: number): string {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 70) return 'text-blue-600';
    if (pct >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  getProgressBarColor(pct: number): string {
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getCatProgressColor(earned: number, max: number): string {
    const pct = max > 0 ? (earned / max) * 100 : 0;
    if (pct >= 90) return 'bg-green-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getProofStatusClass(status: number): string {
    switch (status) {
      case 0: return 'bg-slate-100 text-slate-600';
      case 1: return 'bg-yellow-100 text-yellow-700';
      case 2: return 'bg-green-100 text-green-700';
      case 3: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getProofStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Chua nop';
      case 1: return 'Cho duyet';
      case 2: return 'Da duyet';
      case 3: return 'Bi tu choi';
      default: return 'Khong ro';
    }
  }
}
