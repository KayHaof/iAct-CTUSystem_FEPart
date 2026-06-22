import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CriteriaScore } from '../../models/dashboard.model';

@Component({
  selector: 'app-criteria-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './criteria-chart.component.html',
  styleUrl: './criteria-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CriteriaChartComponent {
  @Input() scores: CriteriaScore[] = [];
}
