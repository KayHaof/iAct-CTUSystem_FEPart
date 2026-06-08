import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);
  theme = input<'light' | 'dark'>('light');

  pageSizeOptions = input<number[]>([5, 10, 15, 20, 50]);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  isDropdownOpen = signal(false);

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  startItem = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const range = 2;
    const pagesArr: number[] = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
        pagesArr.push(i);
      }
    }

    const result: (number | string)[] = [];
    let lastPushedPage: number | null = null;

    for (const page of pagesArr) {
      if (lastPushedPage !== null) {
        if (page - lastPushedPage === 2) {
          result.push(lastPushedPage + 1);
        } else if (page - lastPushedPage !== 1) {
          result.push('...');
        }
      }
      result.push(page);
      lastPushedPage = page;
    }

    return result;
  });

  onPageClick(page: number | string) {
    if (typeof page === 'number' && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = Number(target.value);
    if (!isNaN(newSize)) {
      this.pageSizeChange.emit(newSize);
      this.pageChange.emit(1);
    }
  }

  selectPageSize(size: number) {
    this.pageSizeChange.emit(size);
    this.pageChange.emit(1);
    this.isDropdownOpen.set(false);
  }

  onBlur() {
    setTimeout(() => {
      this.isDropdownOpen.set(false);
    }, 150);
  }
}
