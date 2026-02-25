import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { Activity } from '../../models/dashboard.model';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.scss',
})
export class ActivityListComponent {
  @Input() activities: Activity[] = [];
  @Output() itemClick = new EventEmitter<string>();
}
