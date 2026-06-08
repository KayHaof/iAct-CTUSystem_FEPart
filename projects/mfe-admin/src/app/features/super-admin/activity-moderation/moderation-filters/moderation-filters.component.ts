import { Component, OnInit, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModerationFilters } from '../../../../shared/models/activity-moderation.model';
import { ActivityModerationService } from '../../services/activity-moderation.service';
import { ApiResponse, PageDTO, Department } from 'interface';

@Component({
  selector: 'app-moderation-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moderation-filters.component.html',
  styleUrls: ['./moderation-filters.component.scss'],
})
export class ModerationFiltersComponent implements OnInit {
  private moderationService = inject(ActivityModerationService);

  departments = signal<Department[]>([]);
  keyword = signal<string>('');

  filterApplied = output<ModerationFilters>();

  selectedDepartment = signal<number | ''>('');
  selectedStatus = signal<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  ngOnInit() {
    this.loadDepartments();
  }

  onKeywordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.keyword.set(input.value);
  }

  clearKeyword(): void {
    this.keyword.set('');
    this.applyFilters();
  }

  loadDepartments() {
    this.moderationService.getAllDepartments().subscribe({
      next: (res: ApiResponse<PageDTO<Department>>) => {
        if (res.data && res.data.data) {
          this.departments.set(res.data.data);
        }
      },
    });
  }

  applyFilters() {
    const filters: ModerationFilters = {
      departmentId: this.selectedDepartment() === '' ? null : Number(this.selectedDepartment()),
      status: this.selectedStatus(),
      keyword: this.keyword().trim(),
    };

    this.filterApplied.emit(filters);
  }
}
