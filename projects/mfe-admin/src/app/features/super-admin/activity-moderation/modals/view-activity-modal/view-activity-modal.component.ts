import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Activity } from '../../../../../shared/models/activity.model';
import { ActivityModerationService } from '../../../services/activity-moderation.service';
import { ApiResponse } from 'interface';

@Component({
  selector: 'app-view-activity-modal',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './view-activity-modal.component.html',
})
export class ViewActivityModalComponent implements OnInit {
  activityId = input.required<number>();
  modalClosed = output<void>();

  private moderationService = inject(ActivityModerationService);

  activity = signal<Activity | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.fetchActivityDetails();
  }

  fetchActivityDetails() {
    this.isLoading.set(true);
    this.moderationService.getActivityDetails(this.activityId().toString()).subscribe({
      next: (res: ApiResponse<Activity>) => {
        this.activity.set(res.data as Activity);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onClose() {
    this.modalClosed.emit();
  }
}
