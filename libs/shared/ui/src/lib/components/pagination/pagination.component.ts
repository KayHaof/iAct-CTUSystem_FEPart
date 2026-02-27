import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  // Inputs dùng Signal
  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);

  // Output dùng hàm output() mới
  pageChange = output<number>();

  // Tính toán tổng số trang
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  protected mathMin = Math.min;
  // Tạo mảng các số trang hiển thị (Logic rút gọn dấu ...)
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const range = 2; // Số lượng trang hiển thị quanh trang hiện tại
    const pages: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - range && i <= current + range)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
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
}
