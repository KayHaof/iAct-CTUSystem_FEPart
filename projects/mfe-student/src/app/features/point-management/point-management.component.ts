import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SemesterService } from '../../shared/services/semester.service';
import { ApiResponse, Semester } from '@my-mfe/interface';

interface RuleCategoryResponse {
  id?: number;
  categoryId?: number;
  code?: string;
  categoryCode?: string;
  name?: string;
  categoryName?: string;
  maxPoint?: number;
  earnedPoint?: number;
  percentage?: number;
  parentId?: number | null;
  level?: number;
  isActive?: boolean;
  children?: RuleCategoryResponse[];
}

interface PointContribution {
  activityId?: number;
  activityTitle?: string;
  activityName?: string;
  categoryId?: number;
  categoryName?: string;
  earnedPoint?: number;
  awardedAt?: string;
  attendedAt?: string;
  proofStatus?: number;
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
  status: PointStatus;
  categoryBreakdown?: RuleCategoryResponse[];
  warnings?: string[];
}

interface PointDetailsResponse {
  totalPoint?: number;
  maxPoint?: number;
  categories?: RuleCategoryResponse[];
  details?: PointContribution[];
}

interface UiCategory {
  id: number;
  code: string;
  name: string;
  maxPoint: number;
  earnedPoint: number;
  percentage: number;
  cappedEarnedPoint: number;
  remainingPoint: number;
  isLeaf: boolean;
  children: UiCategory[];
}

interface CategoryRow extends UiCategory {
  depth: number;
}

type PointStatus = 'excellent' | 'good' | 'warning' | 'danger' | 'unknown';

@Component({
  selector: 'app-point-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './point-management.component.html',
  styleUrl: './point-management.component.scss',
})
export class PointManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private semesterService = inject(SemesterService);
  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/activity/api/v1`;

  summary = signal<PointSummary | null>(null);
  categories = signal<UiCategory[]>([]);
  details = signal<PointContribution[]>([]);
  semesters = signal<Semester[]>([]);
  selectedSemesterId = signal<number>(0);
  isSemesterMenuOpen = signal(false);
  selectedRootCategoryId = signal<number | null>(null);
  isLoading = signal(true);

  readonly totalEarned = computed(() => this.sumEarned(this.categories()));
  readonly totalMax = computed(() => this.sumMax(this.categories()));
  readonly remainingPoint = computed(() => Math.max(this.totalMax() - this.totalEarned(), 0));
  readonly totalPercentage = computed(() =>
    this.calculatePercentage(this.totalEarned(), this.totalMax()),
  );
  readonly currentStatus = computed<PointStatus>(() => this.resolveStatus(this.totalPercentage()));
  readonly rootCategoryCount = computed(() => this.categories().length);
  readonly categoryCount = computed(() => this.countCategories(this.categories()));
  readonly leafCategoryCount = computed(() => this.countLeafCategories(this.categories()));
  readonly categoryRows = computed(() => this.flattenCategoryRows(this.categories()));
  readonly selectedRootCategory = computed(() => {
    const categories = this.categories();
    const selectedId = this.selectedRootCategoryId();
    return categories.find((category) => category.id === selectedId) || categories[0] || null;
  });
  readonly selectedRootCategoryRows = computed(() => {
    const root = this.selectedRootCategory();
    return root ? this.flattenCategoryRows([root]) : [];
  });
  readonly selectedSemesterLabel = computed(() => {
    const selectedId = this.selectedSemesterId();
    const semester = this.semesters().find((item) => item.id === selectedId);
    return semester ? this.formatSemesterLabel(semester) : 'Chưa chọn học kỳ';
  });

  ngOnInit(): void {
    this.loadSemesters();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isSemesterMenuOpen()) {
      return;
    }

    const target = event.target as Element | null;
    if (target?.closest('.semester-select')) {
      return;
    }

    this.closeSemesterMenu();
  }

  loadSemesters(): void {
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        const list = res.data || [];
        this.semesters.set(list);
        const active = list.find((s: Semester) => s.isActive);
        const selected = active || list[0];

        if (selected) {
          this.selectedSemesterId.set(selected.id);
          this.loadPointData(selected.id);
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

  toggleSemesterMenu(): void {
    this.isSemesterMenuOpen.update((isOpen) => !isOpen);
  }

  closeSemesterMenu(): void {
    this.isSemesterMenuOpen.set(false);
  }

  selectSemester(semester: Semester): void {
    if (semester.id === this.selectedSemesterId()) {
      this.closeSemesterMenu();
      return;
    }

    this.selectedSemesterId.set(semester.id);
    this.closeSemesterMenu();
    this.loadPointData(semester.id);
  }

  loadPointData(semesterId: number): void {
    this.isLoading.set(true);

    forkJoin({
      summary: this.http
        .get<ApiResponse<PointSummary>>(`${this.apiUrl}/student-points/summary`, {
          params: { semesterId: semesterId.toString() },
        })
        .pipe(catchError(() => of(null))),
      details: this.http
        .get<ApiResponse<PointDetailsResponse>>(`${this.apiUrl}/student-points/details`, {
          params: { semesterId: semesterId.toString() },
        })
        .pipe(catchError(() => of(null))),
      rules: this.http
        .get<ApiResponse<RuleCategoryResponse[]>>(`${this.apiUrl}/student-points/categories`, {
          params: { semesterId: semesterId.toString() },
        })
        .pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ summary, details, rules }) => {
        const summaryData = summary?.data ?? null;
        const detailsData = details?.data ?? null;
        const ruleCategories = rules?.data || [];
        const detailCategories = detailsData?.categories || [];
        const breakdown = summaryData?.categoryBreakdown || [];

        const earnedByCategory = this.buildEarnedPointMap([...detailCategories, ...breakdown]);
        const sourceTree = ruleCategories.length > 0 ? ruleCategories : detailCategories;

        this.summary.set(summaryData);
        const normalizedCategories = this.normalizeCategoryTree(sourceTree, earnedByCategory);
        this.categories.set(normalizedCategories);
        this.ensureSelectedRootCategory(normalizedCategories);
        this.details.set(detailsData?.details || this.flattenContributions(detailCategories));
      });
  }

  getStatusLabel(status: PointStatus): string {
    switch (status) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'warning':
        return 'Trung bình';
      case 'danger':
        return 'Yếu';
      default:
        return 'Chưa xác định';
    }
  }

  getStatusIcon(status: PointStatus): string {
    switch (status) {
      case 'excellent':
        return 'bi-trophy-fill';
      case 'good':
        return 'bi-check-circle-fill';
      case 'warning':
        return 'bi-exclamation-triangle-fill';
      case 'danger':
        return 'bi-x-circle-fill';
      default:
        return 'bi-dash-circle-fill';
    }
  }

  getStatusTone(status: PointStatus): string {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'info';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'muted';
    }
  }

  getCategoryStatus(category: UiCategory): PointStatus {
    if (category.maxPoint <= 0) return 'unknown';
    return this.resolveStatus(category.percentage);
  }

  getProofStatusLabel(status?: number): string {
    switch (status) {
      case 0:
        return 'Chưa nộp';
      case 1:
        return 'Chờ duyệt';
      case 2:
        return 'Đã duyệt';
      case 3:
        return 'Bị từ chối';
      default:
        return 'Không rõ';
    }
  }

  getProofStatusTone(status?: number): string {
    switch (status) {
      case 1:
        return 'warning';
      case 2:
        return 'success';
      case 3:
        return 'danger';
      default:
        return 'muted';
    }
  }

  getContributionTitle(detail: PointContribution): string {
    return detail.activityTitle || detail.activityName || 'Hoạt động';
  }

  getContributionDate(detail: PointContribution): string | null {
    return detail.awardedAt || detail.attendedAt || null;
  }

  trackCategory(_: number, category: UiCategory): number {
    return category.id;
  }

  trackCategoryRow(_: number, category: CategoryRow): string {
    return `${category.depth}-${category.id}`;
  }

  trackContribution(index: number, detail: PointContribution): string {
    return `${detail.activityId || index}-${detail.categoryId || 'category'}-${detail.earnedPoint || 0}`;
  }

  selectRootCategory(categoryId: number): void {
    this.selectedRootCategoryId.set(categoryId);
  }

  formatPoint(value: number | null | undefined): string {
    const point = Number(value || 0);
    return Number.isInteger(point) ? point.toString() : point.toFixed(1);
  }

  formatSemesterLabel(semester: Semester): string {
    return `${semester.semesterName} (${semester.academicYear})`;
  }

  private normalizeCategoryTree(
    categories: RuleCategoryResponse[],
    earnedByCategory: Map<number, number>,
  ): UiCategory[] {
    return categories.map((category, index) =>
      this.normalizeCategory(category, earnedByCategory, index),
    );
  }

  private normalizeCategory(
    category: RuleCategoryResponse,
    earnedByCategory: Map<number, number>,
    index: number,
  ): UiCategory {
    const id = Number(category.id ?? category.categoryId ?? index + 1);
    const children = this.normalizeCategoryTree(category.children || [], earnedByCategory);
    const childEarned = this.sumEarned(children);
    const childMax = this.sumMax(children);
    const explicitMax = Number(category.maxPoint ?? 0);
    const explicitEarned =
      category.earnedPoint != null ? Number(category.earnedPoint || 0) : earnedByCategory.get(id);
    const rawEarned = explicitEarned != null ? explicitEarned : childEarned;
    const maxPoint = explicitMax > 0 ? explicitMax : childMax;
    const cappedEarnedPoint = maxPoint > 0 ? Math.min(Math.max(rawEarned, 0), maxPoint) : 0;

    return {
      id,
      code: category.code || category.categoryCode || `CAT-${id}`,
      name: category.name || category.categoryName || 'Tiêu chí rèn luyện',
      maxPoint,
      earnedPoint: cappedEarnedPoint,
      percentage: this.calculatePercentage(cappedEarnedPoint, maxPoint),
      cappedEarnedPoint,
      remainingPoint: Math.max(maxPoint - cappedEarnedPoint, 0),
      isLeaf: children.length === 0,
      children,
    };
  }

  private buildEarnedPointMap(categories: RuleCategoryResponse[]): Map<number, number> {
    const map = new Map<number, number>();
    const visit = (items: RuleCategoryResponse[]) => {
      for (const item of items) {
        const id = Number(item.id ?? item.categoryId ?? 0);
        if (id > 0 && item.earnedPoint != null) {
          map.set(id, Number(item.earnedPoint || 0));
        }
        visit(item.children || []);
      }
    };

    visit(categories);
    return map;
  }

  private flattenContributions(categories: RuleCategoryResponse[]): PointContribution[] {
    const contributions: PointContribution[] = [];
    const visit = (items: RuleCategoryResponse[]) => {
      for (const item of items) {
        const criteria =
          (item as RuleCategoryResponse & { criteria?: PointContribution[] }).criteria || [];
        contributions.push(...criteria);
        visit(item.children || []);
      }
    };

    visit(categories);
    return contributions;
  }

  private sumEarned(categories: UiCategory[]): number {
    return categories.reduce((total, category) => total + category.earnedPoint, 0);
  }

  private sumMax(categories: UiCategory[]): number {
    return categories.reduce((total, category) => total + category.maxPoint, 0);
  }

  private countCategories(categories: UiCategory[]): number {
    return categories.reduce(
      (total, category) => total + 1 + this.countCategories(category.children),
      0,
    );
  }

  private countLeafCategories(categories: UiCategory[]): number {
    return categories.reduce((total, category) => {
      if (category.children.length === 0) return total + 1;
      return total + this.countLeafCategories(category.children);
    }, 0);
  }

  private ensureSelectedRootCategory(categories: UiCategory[]): void {
    if (categories.length === 0) {
      this.selectedRootCategoryId.set(null);
      return;
    }

    const selectedId = this.selectedRootCategoryId();
    const selectedStillExists = categories.some((category) => category.id === selectedId);
    if (!selectedStillExists) {
      this.selectedRootCategoryId.set(categories[0].id);
    }
  }

  private flattenCategoryRows(categories: UiCategory[], depth = 0): CategoryRow[] {
    return categories.flatMap((category) => [
      { ...category, depth },
      ...this.flattenCategoryRows(category.children, depth + 1),
    ]);
  }

  private calculatePercentage(earned: number, max: number): number {
    if (max <= 0) return 0;
    return Math.min(100, Math.round((earned / max) * 1000) / 10);
  }

  resolveStatus(percentage: number): PointStatus {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'warning';
    if (this.totalMax() > 0) return 'danger';
    return 'unknown';
  }
}
