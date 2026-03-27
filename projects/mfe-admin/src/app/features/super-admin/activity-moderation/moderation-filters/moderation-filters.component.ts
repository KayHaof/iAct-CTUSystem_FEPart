import { Component, OnInit, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModerationFilters } from '../../../../shared/models/activity-moderation.model';
import { ActivityModerationService } from '../../services/activity-moderation.service';
import { ApiResponse, PageDTO, Department, Semester } from 'interface';

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
  semesters = signal<Semester[]>([]);

  filterApplied = output<ModerationFilters>();

  selectedDepartment = signal<number | ''>('');
  selectedSemester = signal<number | ''>('');
  selectedStatus = signal<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  ngOnInit() {
    this.loadDropdownData();
  }

  loadDropdownData() {
    this.moderationService.getAllDepartments().subscribe({
      next: (res: ApiResponse<PageDTO<Department>>) => {
        if (res.result && res.result.data) {
          this.departments.set(res.result.data);
        }
      },
    });

    this.moderationService.getAllSemesters().subscribe({
      next: (res: ApiResponse<Semester[]>) => {
        if (res.result) {
          this.semesters.set(res.result);
        }
      },
    });
  }

  onApplyFilters() {
    const filters: ModerationFilters = {
      departmentId: this.selectedDepartment() === '' ? null : Number(this.selectedDepartment()),
      semesterId: this.selectedSemester() === '' ? null : Number(this.selectedSemester()),
      status: this.selectedStatus(),
    };

    this.filterApplied.emit(filters);
  }
}
