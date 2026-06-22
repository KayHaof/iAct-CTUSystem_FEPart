import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableContainerComponent, PaginationComponent } from '@my-mfe/ui';
import { Activity } from '../../../../shared/models/activity.model';

@Component({
  selector: 'app-moderation-table',
  standalone: true,
  imports: [CommonModule, TableContainerComponent, PaginationComponent],
  providers: [DatePipe],
  templateUrl: './moderation-table.component.html',
  styleUrls: ['./moderation-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModerationTableComponent {
  isLoading = input<boolean>(false);
  data = input<Activity[]>([]);
  total = input<number>(0);
  currentPage = input<number>(1);
  pageSize = input<number>(10);

  sortColumn = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

  sortedData = computed(() => {
    const rawData = this.data();
    if (!rawData || rawData.length === 0) return [];

    const sorted = [...rawData];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    sorted.sort((a, b) => {
      if (col === 'createdAt') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        return dir === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

    return sorted;
  });

  pageChanged = output<number>();
  sizeChanged = output<number>();
  approve = output<Activity>();
  reject = output<Activity>();
  view = output<Activity>();
  viewReason = output<Activity>();

  onSort(column: string) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }
}
