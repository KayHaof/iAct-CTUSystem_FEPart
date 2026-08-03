import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AlertService,
  ConfirmDialogComponent,
  ConfirmService,
  CustomSelectComponent,
  CustomSelectOption,
  CustomSelectValue,
  PaginationComponent,
  TableContainerComponent,
} from '@my-mfe/ui';

import { MasterDataService } from '../services/master-data.service';
import {
  CategoryFilters,
  CategoryRequest,
  CategoryResponse,
} from '../../../shared/models/master-data.model';

type CategoryForm = {
  name: string;
  code: string;
  maxPoint: number;
  parentId: number | '';
  isActive: boolean;
};

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
  icon?: string;
};

type TreeCategoryNode = CategoryResponse & { level: number };

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    CustomSelectComponent,
    PaginationComponent,
    TableContainerComponent,
  ],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManagementComponent implements OnInit {
  private readonly masterDataService = inject(MasterDataService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  public categories = signal<CategoryResponse[]>([]);
  public categoryTree = signal<CategoryResponse[]>([]);
  public keyword = signal('');
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public isTreeOpen = signal(false);
  public editingCategory = signal<CategoryResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public filters = signal<CategoryFilters>({
    active: '',
    parentId: '',
  });

  public form = signal<CategoryForm>(this.createEmptyForm());

  public readonly statusTabs: Array<SelectOption<CategoryFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Toàn bộ danh mục', icon: 'bi-ui-checks-grid' },
    { label: 'Hoạt động', value: 'true', description: 'Đang được sử dụng', icon: 'bi-check2-circle' },
    { label: 'Tạm ngừng', value: 'false', description: 'Đã ẩn khỏi nghiệp vụ mới', icon: 'bi-pause-circle' },
  ];

  public readonly activeFormOptions: CustomSelectOption[] = [
    {
      label: 'Đang hoạt động',
      value: true,
      description: 'Cho phép sử dụng trong cấu hình điểm',
      icon: 'bi-check2-circle',
    },
    {
      label: 'Tạm ngừng',
      value: false,
      description: 'Ẩn khỏi các lựa chọn nghiệp vụ mới',
      icon: 'bi-pause-circle',
    },
  ];

  public flattenedTree = computed(() => this.flattenTree(this.categoryTree()));
  public rootCount = computed(() => this.flattenedTree().filter((node) => node.level === 0).length);
  public levelTwoCount = computed(
    () => this.flattenedTree().filter((node) => node.level === 1).length,
  );
  public activeCount = computed(
    () => this.flattenedTree().filter((category) => category.isActive !== false).length,
  );
  public inactiveCount = computed(() => Math.max(this.flattenedTree().length - this.activeCount(), 0));
  public levelOneCategories = computed(() =>
    this.flattenedTree().filter((node) => node.level === 0),
  );
  public totalPoint = computed(() =>
    this.flattenedTree().reduce((total, category) => total + (Number(category.maxPoint) || 0), 0),
  );
  public filteredCategories = computed(() => {
    const normalizedKeyword = this.normalizeText(this.keyword());
    if (!normalizedKeyword) {
      return this.categories();
    }

    return this.categories().filter((category) => {
      const haystack = [
        category.name,
        category.code,
        this.getParentName(category.parentId),
        this.getLevelLabel(this.getCategoryLevel(category.id)),
      ]
        .filter(Boolean)
        .join(' ');

      return this.normalizeText(haystack).includes(normalizedKeyword);
    });
  });
  public pagedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredCategories().slice(start, start + this.pageSize());
  });
  public parentOptions = computed(() =>
    this.flattenedTree().filter((category) => this.canUseAsParent(category)),
  );
  public parentFilterOptions = computed<CustomSelectOption[]>(() => [
    {
      value: '',
      label: 'Tất cả danh mục cấp 1',
      description: 'Không lọc theo nhóm cha',
      icon: 'bi-diagram-3',
    },
    ...this.levelOneCategories().map((category) => ({
      value: category.id,
      label: category.name,
      description: this.getNodeCode(category),
      icon: 'bi-folder2-open',
    })),
  ]);
  public parentFormOptions = computed<CustomSelectOption[]>(() => [
    {
      value: '',
      label: 'Danh mục gốc',
      description: 'Không có danh mục cha',
      icon: 'bi-diagram-2',
    },
    ...this.parentOptions().map((category) => ({
      value: category.id,
      label: category.name,
      description: `${this.getLevelLabel(category.level)} - ${this.getNodeCode(category)}`,
      icon: category.level === 0 ? 'bi-folder2-open' : 'bi-file-earmark-text',
    })),
  ]);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);

    this.masterDataService
      .getCategories(this.filters())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.categories.set(response.data || []);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh mục điểm rèn luyện.'),
      });

    this.loadCategoryTree();
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
  }

  openEditForm(category: CategoryResponse): void {
    this.editingCategory.set(category);
    this.form.set({
      name: category.name || '',
      code: category.code || '',
      maxPoint: Number(category.maxPoint) || 0,
      parentId: category.parentId ?? '',
      isActive: category.isActive !== false,
    });
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCategory.set(null);
    this.form.set(this.createEmptyForm());
  }

  openTree(): void {
    this.isTreeOpen.set(true);
  }

  closeTree(): void {
    this.isTreeOpen.set(false);
  }

  selectStatusFilter(value: CategoryFilters['active']): void {
    this.filters.update((current) => ({ ...current, active: value, parentId: '' }));
    this.applyFilters();
  }

  onKeywordChange(value: string): void {
    this.keyword.set(value);
    this.currentPage.set(1);
    this.normalizeCurrentPage();
  }

  clearKeyword(): void {
    this.keyword.set('');
    this.currentPage.set(1);
    this.normalizeCurrentPage();
  }

  onParentFilterChange(value: CustomSelectValue): void {
    this.filters.update((current) => ({ ...current, parentId: typeof value === 'number' ? value : '' }));
    this.applyFilters();
  }

  onParentFormChange(value: CustomSelectValue): void {
    this.updateForm('parentId', typeof value === 'number' ? value : '');
  }

  onActiveFormChange(value: CustomSelectValue): void {
    if (typeof value === 'boolean') {
      this.updateForm('isActive', value);
    }
  }

  updateForm<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateMaxPoint(value: string | number): void {
    this.updateForm('maxPoint', Math.max(Number(value) || 0, 0));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadCategories();
  }

  resetFilters(): void {
    this.filters.set({ active: '', parentId: '' });
    this.keyword.set('');
    this.currentPage.set(1);
    this.loadCategories();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  saveCategory(): void {
    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    const current = this.editingCategory();
    const request = current
      ? this.masterDataService.updateCategory(current.id, payload)
      : this.masterDataService.createCategory(payload);

    this.isSaving.set(true);
    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.alertService.success(current ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục mới.');
        this.closeForm();
        this.loadCategories();
      },
      error: () => this.alertService.error('Không thể lưu danh mục. Vui lòng kiểm tra dữ liệu.'),
    });
  }

  toggleActive(category: CategoryResponse): void {
    const isActive = category.isActive !== false;
    const request = isActive
      ? this.masterDataService.deactivateCategory(category.id)
      : this.masterDataService.activateCategory(category.id);

    request.subscribe({
      next: () => {
        this.alertService.success(isActive ? 'Đã tạm ngừng danh mục.' : 'Đã kích hoạt danh mục.');
        this.loadCategories();
      },
      error: () => this.alertService.error('Không thể cập nhật trạng thái danh mục.'),
    });
  }

  deleteCategory(category: CategoryResponse): void {
    this.confirmService.warning({
      title: 'Xóa danh mục',
      message: `Hệ thống sẽ tự tạm ngừng danh mục "${category.name}".`,
      confirmText: 'Xóa',
      onConfirm: () => {
        this.masterDataService.deleteCategory(category.id).subscribe({
          next: () => {
            this.alertService.success('Đã xử lý xóa danh mục.');
            this.loadCategories();
          },
          error: () => this.alertService.error('Không thể xóa danh mục này.'),
        });
      },
    });
  }

  getParentName(parentId: number | null): string {
    if (parentId === null) {
      return 'Danh mục gốc';
    }

    return (
      this.flattenedTree().find((category) => category.id === parentId)?.name || 'Không xác định'
    );
  }

  getCategoryLevel(categoryId: number): number {
    return this.flattenedTree().find((category) => category.id === categoryId)?.level ?? 0;
  }

  getLevelLabel(level: number): string {
    return `Cấp ${level + 1}`;
  }

  getNodeCode(node: CategoryResponse): string {
    return node.code || 'Chưa có mã';
  }

  getStatusTabCount(value: CategoryFilters['active']): number {
    if (value === 'true') {
      return this.activeCount();
    }

    if (value === 'false') {
      return this.inactiveCount();
    }

    return this.flattenedTree().length;
  }

  getRootChildrenCount(category: CategoryResponse): number {
    return category.children?.length ?? 0;
  }

  scrollToTop(): void {
    this.getScrollContainer().scrollTo({ top: 0, behavior: 'smooth' });
  }

  flattenTree(nodes: CategoryResponse[], level = 0): TreeCategoryNode[] {
    return nodes.flatMap((node) => [
      { ...node, level },
      ...this.flattenTree(node.children || [], level + 1),
    ]);
  }

  private loadCategoryTree(): void {
    this.masterDataService.getCategoryTree('').subscribe({
      next: (response) => this.categoryTree.set(response.data || []),
      error: () => this.categoryTree.set([]),
    });
  }

  private buildPayload(): CategoryRequest | null {
    const current = this.form();
    const name = current.name.trim();
    const code = current.code.trim();
    const maxPoint = Number(current.maxPoint) || 0;
    const parentId = current.parentId === '' ? null : Number(current.parentId);

    if (!name) {
      this.alertService.warning('Vui lòng nhập tên danh mục.');
      return null;
    }

    if (maxPoint < 0) {
      this.alertService.warning('Điểm tối đa không được âm.');
      return null;
    }

    if (this.editingCategory()?.id === parentId) {
      this.alertService.warning('Danh mục không thể chọn chính nó làm danh mục cha.');
      return null;
    }

    return {
      name,
      code: code || null,
      maxPoint,
      parentId,
      isActive: current.isActive,
    };
  }

  private canUseAsParent(category: CategoryResponse): boolean {
    const current = this.editingCategory();
    if (!current) {
      return true;
    }

    if (category.id === current.id) {
      return false;
    }

    return !this.collectDescendantIds(current).has(category.id);
  }

  private collectDescendantIds(category: CategoryResponse): Set<number> {
    const descendants = new Set<number>();
    const visit = (node: CategoryResponse): void => {
      for (const child of node.children || []) {
        descendants.add(child.id);
        visit(child);
      }
    };

    const treeNode = this.findInTree(category.id, this.categoryTree()) || category;
    visit(treeNode);
    return descendants;
  }

  private findInTree(id: number, nodes: CategoryResponse[]): CategoryResponse | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }

      const child = this.findInTree(id, node.children || []);
      if (child) {
        return child;
      }
    }

    return null;
  }

  private getScrollContainer(): Element | Window {
    return document.querySelector('.main-scrollable') || document.scrollingElement || window;
  }

  private normalizeCurrentPage(): void {
    const totalPages = Math.max(Math.ceil(this.filteredCategories().length / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
  }

  private normalizeText(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  private createEmptyForm(): CategoryForm {
    return {
      name: '',
      code: '',
      maxPoint: 0,
      parentId: '',
      isActive: true,
    };
  }
}
