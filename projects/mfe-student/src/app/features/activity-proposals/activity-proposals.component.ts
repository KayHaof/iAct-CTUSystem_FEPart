import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Activity } from '../../shared/models/activity.model';
import { ActivityProposalService } from '../../shared/services/activity-proposal.service';

@Component({
  selector: 'app-activity-proposals',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-proposals.component.html',
  styleUrls: ['./activity-proposals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityProposalsComponent implements OnInit {
  private readonly proposalService = inject(ActivityProposalService);
  private readonly fallbackActivityImage = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#eff6ff"/>
          <stop offset="1" stop-color="#dcfce7"/>
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="24" fill="url(#g)"/>
      <circle cx="85" cy="78" r="30" fill="#2563eb" opacity=".16"/>
      <circle cx="225" cy="118" r="44" fill="#059669" opacity=".14"/>
      <path
        d="M96 132h128a10 10 0 0 0 8-16l-25-34a10 10 0 0 0-16 0l-18 24-12-15a10 10 0 0 0-16 1l-57 76a10 10 0 0 0 8 16Z"
        transform="translate(0 -34)"
        fill="#ffffff"
        opacity=".88"
      />
      <text
        x="160"
        y="154"
        text-anchor="middle"
        font-family="Arial,sans-serif"
        font-size="17"
        font-weight="700"
        fill="#334155"
      >
        iAct CTU
      </text>
    </svg>
  `)}`;

  readonly isLoading = signal(true);
  readonly proposals = signal<Activity[]>([]);
  readonly currentStatus = signal<'ALL' | '0' | '1' | '2' | '3'>('ALL');
  readonly totalRows = signal(0);

  readonly filteredProposals = computed(() => {
    const status = this.currentStatus();
    if (status === 'ALL') return this.proposals();
    return this.proposals().filter((activity) => String(activity.status) === status);
  });

  readonly pendingCount = computed(() => this.countByStatus(0));
  readonly approvedCount = computed(() => this.countByStatus(1));
  readonly rejectedCount = computed(() => this.countByStatus(2));
  readonly draftCount = computed(() => this.countByStatus(3));

  ngOnInit(): void {
    this.loadProposals();
  }

  loadProposals(): void {
    this.isLoading.set(true);
    this.proposalService.getMyProposals(1, 50).subscribe({
      next: (page) => {
        const data = page?.data || [];
        this.proposals.set(data);
        this.totalRows.set(page?.totalRows || data.length);
        this.isLoading.set(false);
      },
      error: () => {
        this.proposals.set([]);
        this.totalRows.set(0);
        this.isLoading.set(false);
      },
    });
  }

  setStatus(status: 'ALL' | '0' | '1' | '2' | '3'): void {
    this.currentStatus.set(status);
  }

  statusLabel(status: number | null | undefined): string {
    if (status === 0) return 'Chờ duyệt';
    if (status === 1) return 'Đã duyệt';
    if (status === 2) return 'Từ chối';
    if (status === 3) return 'Bản nháp';
    if (status === 4) return 'Đã hủy';
    return 'Đang cập nhật';
  }

  statusClass(status: number | null | undefined): string {
    if (status === 0) return 'status status--pending';
    if (status === 1) return 'status status--approved';
    if (status === 2) return 'status status--rejected';
    if (status === 3) return 'status status--draft';
    return 'status';
  }

  activityImage(activity: Activity): string {
    return activity.thumbnail || activity.coverImage || this.fallbackActivityImage;
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (image && image.src !== this.fallbackActivityImage) {
      image.src = this.fallbackActivityImage;
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'Chưa có thời gian';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private countByStatus(status: number): number {
    return this.proposals().filter((activity) => activity.status === status).length;
  }
}
