import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ModerationStats } from '../../../../shared/models/activity-moderation.model';
import { ApexChart, ApexDataLabels, ApexLegend, ApexPlotOptions, ApexTooltip } from 'ng-apexcharts';

@Component({
  selector: 'app-moderation-stats',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './moderation-stats.component.html',
  styleUrls: ['./moderation-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationStatsComponent {
  statsData = input<ModerationStats | null>(null);

  totalCount = computed(() => {
    const s = this.statsData();
    return (s?.pendingReview || 0) + (s?.approvedThisTerm || 0) + (s?.rejected || 0);
  });

  // Cấu hình biểu đồ
  chartOptions = computed(() => {
    const stats = this.statsData();
    return {
      series: [stats?.pendingReview || 0, stats?.approvedThisTerm || 0, stats?.rejected || 0],
      chart: {
        type: 'pie' as const,
        height: 130,
        sparkline: { enabled: true },
        animations: { enabled: true, speed: 800 },
      } as ApexChart,

      labels: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],

      colors: ['#f59e0b', '#2563eb', '#dc2626'],
      plotOptions: {
        pie: {
          expandOnClick: true,
        },
      } as ApexPlotOptions,
      dataLabels: {
        enabled: true,
        dropShadow: { enabled: false },
        style: { fontSize: '10px', fontWeight: 600, colors: ['#fff'] },
      } as ApexDataLabels,
      legend: { show: false } as ApexLegend,
      stroke: {
        show: false,
        width: 0,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val} hoạt động`,
        },
      } as ApexTooltip,
    };
  });
}
