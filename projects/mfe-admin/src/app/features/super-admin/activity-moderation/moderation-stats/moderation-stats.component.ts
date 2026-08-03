import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from 'ng-apexcharts';

import {
  ModerationDepartmentStats,
  ModerationStats,
} from '../../../../shared/models/activity-moderation.model';

type ChartTooltipContext = {
  series: number[][];
  seriesIndex: number;
  dataPointIndex: number;
  w: {
    globals: {
      labels: string[];
      seriesNames: string[];
      colors: string[];
    };
  };
};

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

  readonly totalCount = computed(() => {
    const stats = this.statsData();
    return (stats?.pendingReview || 0) + (stats?.approvedThisTerm || 0) + (stats?.rejected || 0);
  });

  readonly departments = computed<ModerationDepartmentStats[]>(() => this.statsData()?.byDepartment ?? []);

  readonly hasChartData = computed(() => this.departments().length > 0);

  readonly legendItems = computed(() => [
    {
      label: 'Chờ duyệt',
      value: this.statsData()?.pendingReview || 0,
      color: '#f59e0b',
    },
    {
      label: 'Đã duyệt',
      value: this.statsData()?.approvedThisTerm || 0,
      color: '#2563eb',
    },
    {
      label: 'Đã từ chối',
      value: this.statsData()?.rejected || 0,
      color: '#ef4444',
    },
  ]);

  readonly chartOptions = computed(() => {
    const rows = this.departments();
    const categories = rows.map((row) => row.departmentName || 'Cấp Trường');
    const height = Math.min(500, Math.max(170, rows.length * 48 + 116));

    return {
      series: [
        {
          name: 'Chờ duyệt',
          data: rows.map((row) => row.pendingReview || 0),
        },
        {
          name: 'Đã duyệt',
          data: rows.map((row) => row.approvedThisTerm || 0),
        },
        {
          name: 'Đã từ chối',
          data: rows.map((row) => row.rejected || 0),
        },
      ] as ApexAxisChartSeries,
      chart: {
        type: 'bar' as const,
        height,
        stacked: true,
        toolbar: { show: false },
        parentHeightOffset: 0,
        background: 'transparent',
        animations: {
          enabled: true,
          speed: 420,
        },
      } as ApexChart,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          borderRadiusApplication: 'end',
          barHeight: '52%',
        },
      } as ApexPlotOptions,
      dataLabels: {
        enabled: false,
      } as ApexDataLabels,
      stroke: {
        width: 1,
        colors: ['#ffffff'],
      },
      fill: {
        opacity: 1,
      } as ApexFill,
      grid: {
        strokeDashArray: 3,
        borderColor: '#e2e8f0',
        padding: {
          top: 0,
          right: 12,
          bottom: 0,
          left: 4,
        },
        xaxis: {
          lines: {
            show: true,
          },
        },
      } as ApexGrid,
      xaxis: {
        categories,
        labels: {
          trim: true,
          style: {
            colors: '#64748b',
            fontSize: '12px',
            fontWeight: 700,
          },
        },
      } as ApexXAxis,
      yaxis: {
        labels: {
          style: {
            colors: '#0f172a',
            fontSize: '12px',
            fontWeight: 700,
          },
          maxWidth: 210,
        },
      } as ApexYAxis,
      legend: {
        show: false,
      } as ApexLegend,
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: false,
        fixed: {
          enabled: true,
          position: 'topRight',
          offsetX: 0,
          offsetY: 8,
        },
        custom: ({ series, dataPointIndex, w }: ChartTooltipContext) => {
          const label = this.escapeHtml(w.globals.labels[dataPointIndex] ?? '');
          const total = series.reduce((sum, current) => sum + (current[dataPointIndex] || 0), 0);
          const rows = w.globals.seriesNames
            .map((seriesName, seriesIndex) => {
              const value = series[seriesIndex]?.[dataPointIndex] || 0;
              const color = w.globals.colors[seriesIndex] || '#94a3b8';

              return `
                <div class="tooltip-row">
                  <span class="tooltip-row__label">
                    <i class="tooltip-row__dot" style="background:${color}"></i>
                    ${this.escapeHtml(seriesName)}
                  </span>
                  <strong>${value}</strong>
                </div>
              `;
            })
            .join('');

          return `
            <div class="stats-tooltip">
              <div class="stats-tooltip__title">${label}</div>
              <div class="stats-tooltip__total">Tổng ${total}</div>
              ${rows}
            </div>
          `;
        },
      } as ApexTooltip,
      colors: ['#f59e0b', '#2563eb', '#ef4444'],
    };
  });

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
