import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
} from '@angular/cdk/overlay';

let paginationInstanceId = 0;

@Component({
  selector: 'lib-pagination',
  standalone: true,
  imports: [CommonModule, CdkConnectedOverlay, CdkOverlayOrigin],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);

  totalItems = input.required<number>();
  pageSize = input<number>(10);
  currentPage = input<number>(1);

  pageSizeOptions = input<number[]>([5, 10, 15, 20, 50]);

  pageChange = output<number>();
  pageSizeChange = output<number>();

  readonly isDropdownOpen = signal(false);
  readonly pageSizeMenuId = `pagination-page-size-${++paginationInstanceId}`;
  readonly pageSizePositions: ConnectedPosition[] = [
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -8,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 8,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];

  readonly availablePageSizes = computed(() =>
    [...new Set(this.pageSizeOptions())].filter((size) => Number.isFinite(size) && size > 0),
  );

  readonly totalPages = computed(() => {
    const size = this.safePageSize();
    const total = Math.max(0, this.totalItems());
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  readonly safePageSize = computed(() => Math.max(1, this.pageSize()));

  readonly displayCurrentPage = computed(() => {
    const total = this.totalPages();
    if (total === 0) return 1;
    return Math.min(Math.max(1, this.currentPage()), total);
  });

  readonly startItem = computed(() =>
    this.totalItems() === 0 ? 0 : (this.displayCurrentPage() - 1) * this.safePageSize() + 1,
  );

  readonly endItem = computed(() =>
    Math.min(this.displayCurrentPage() * this.safePageSize(), Math.max(0, this.totalItems())),
  );

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.displayCurrentPage();
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

  onPageClick(page: number | string): void {
    if (typeof page === 'number' && page !== this.displayCurrentPage()) {
      this.pageChange.emit(page);
      this.scrollContentToTop();
    }
  }

  nextPage(): void {
    if (this.displayCurrentPage() < this.totalPages()) {
      this.pageChange.emit(this.displayCurrentPage() + 1);
      this.scrollContentToTop();
    }
  }

  prevPage(): void {
    if (this.displayCurrentPage() > 1) {
      this.pageChange.emit(this.displayCurrentPage() - 1);
      this.scrollContentToTop();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = Number(target.value);
    if (Number.isFinite(newSize) && newSize > 0) {
      this.pageSizeChange.emit(newSize);
      this.pageChange.emit(1);
      this.scrollContentToTop();
    }
  }

  togglePageSizeDropdown(): void {
    this.isDropdownOpen.update((isOpen) => !isOpen);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isDropdownOpen()) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    if (!target.closest('.page-size-dropdown') && !target.closest('.page-size-menu')) {
      this.closePageSizeDropdown();
    }
  }

  selectPageSize(size: number): void {
    if (size <= 0 || size === this.pageSize()) {
      this.closePageSizeDropdown();
      return;
    }

    this.pageSizeChange.emit(size);
    this.pageChange.emit(1);
    this.scrollContentToTop();
    this.closePageSizeDropdown();
  }

  private scrollContentToTop(): void {
    const view = this.document.defaultView;
    if (!view) return;

    const scroll = (): void => {
      const hostElement = this.elementRef.nativeElement as HTMLElement;
      const scrollContainers = this.findScrollContainers(hostElement, view);
      const prefersReducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const behavior = prefersReducedMotion ? 'auto' : 'smooth';

      if (scrollContainers.length === 0) {
        view.scrollTo({ top: 0, behavior });
        return;
      }

      for (const container of scrollContainers) {
        container.scrollTop = 0;
        container.scrollTo({ top: 0, behavior });
      }
    };

    view.requestAnimationFrame(() => {
      scroll();
      view.requestAnimationFrame(scroll);
    });
  }

  private findScrollContainers(hostElement: HTMLElement, view: Window): HTMLElement[] {
    const containers: HTMLElement[] = [];
    let current = hostElement.parentElement;

    while (current) {
      const styles = view.getComputedStyle(current);
      const hasScrollableOverflow = /(auto|scroll|overlay)/.test(styles.overflowY);
      const isMainContentScroller = current.classList.contains('main-scrollable');

      if (isMainContentScroller || hasScrollableOverflow) {
        containers.push(current);
      }

      current = current.parentElement;
    }

    const documentScroller = this.document.scrollingElement as HTMLElement | null;
    if (documentScroller && !containers.includes(documentScroller)) {
      containers.push(documentScroller);
    }

    return containers;
  }

  closePageSizeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onBlur(): void {
    setTimeout(() => this.closePageSizeDropdown(), 150);
  }
}
