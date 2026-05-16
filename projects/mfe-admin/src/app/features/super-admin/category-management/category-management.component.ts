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
import { AlertService, ConfirmService, PaginationComponent, TableContainerComponent } from '@my-mfe/ui';

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

type CategoryDropdownKey = 'statusFilter' | 'parentFilter' | 'parentForm' | 'activeForm';

type SelectOption<T> = {
  label: string;
  value: T;
  description?: string;
};

type TreeCategoryNode = CategoryResponse & { level: number };

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableContainerComponent],
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
  public isLoading = signal(false);
  public isSaving = signal(false);
  public isFormOpen = signal(false);
  public isTreeOpen = signal(false);
  public editingCategory = signal<CategoryResponse | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public openDropdown = signal<CategoryDropdownKey | null>(null);
  public filters = signal<CategoryFilters>({
    active: '',
    parentId: '',
  });

  public form = signal<CategoryForm>(this.createEmptyForm());

  public readonly statusFilterOptions: Array<SelectOption<CategoryFilters['active']>> = [
    { label: 'Tất cả', value: '', description: 'Không giới hạn trạng thái' },
    { label: 'Đang hoạt động', value: 'true', description: 'Chỉ danh mục đang dùng' },
    { label: 'Tạm ngưng', value: 'false', description: 'Danh mục đã tạm ngưng' },
  ];

  public readonly activeFormOptions: Array<SelectOption<boolean>> = [
    { label: 'Đang hoạt động', value: true, description: 'Cho phép sử dụng trong cấu hình điểm' },
    { label: 'Tạm ngưng', value: false, description: 'Ẩn khỏi các lựa chọn nghiệp vụ mới' },
  ];

  public activeCount = computed(
    () => this.categories().filter((category) => category.isActive !== false).length,
  );
  public flattenedTree = computed(() => this.flattenTree(this.categoryTree()));
  public rootCount = computed(() => this.flattenedTree().filter((node) => node.level === 0).length);
  public levelTwoCount = computed(
    () => this.flattenedTree().filter((node) => node.level === 1).length,
  );
  public levelOneCategories = computed(() =>
    this.flattenedTree().filter((node) => node.level === 0),
  );
  public totalPoint = computed(() =>
    this.categories().reduce((total, category) => total + (Number(category.maxPoint) || 0), 0),
  );
  public pagedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.categories().slice(start, start + this.pageSize());
  });
  public parentOptions = computed(() =>
    this.flattenedTree().filter((category) => this.canUseAsParent(category)),
  );

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
          this.categories.set(response.result || []);
          this.normalizeCurrentPage();
        },
        error: () => this.alertService.error('Không thể tải danh mục điểm rèn luyện.'),
      });

    this.masterDataService.getCategoryTree(this.filters().active).subscribe({
      next: (response) => this.categoryTree.set(response.result || []),
      error: () => this.categoryTree.set([]),
    });
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.form.set(this.createEmptyForm());
    this.isFormOpen.set(true);
    this.openDropdown.set(null);
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
    this.openDropdown.set(null);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingCategory.set(null);
    this.form.set(this.createEmptyForm());
    this.openDropdown.set(null);
  }

  openTree(): void {
    this.isTreeOpen.set(true);
    this.openDropdown.set(null);
  }

  closeTree(): void {
    this.isTreeOpen.set(false);
  }

  toggleDropdown(key: CategoryDropdownKey): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  isDropdownOpen(key: CategoryDropdownKey): boolean {
    return this.openDropdown() === key;
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  selectStatusFilter(value: CategoryFilters['active']): void {
    this.updateFilter('active', value);
    this.updateFilter('parentId', '');
    this.closeDropdown();
    this.applyFilters();
  }

  selectParentFilter(value: CategoryFilters['parentId']): void {
    this.updateFilter('parentId', value);
    this.closeDropdown();
    this.applyFilters();
  }

  selectParent(value: number | ''): void {
    this.updateParent(value === '' ? '' : String(value));
    this.closeDropdown();
  }

  selectActiveForm(value: boolean): void {
    this.updateForm('isActive', value);
    this.closeDropdown();
  }

  updateForm<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  updateMaxPoint(value: string): void {
    this.updateForm('maxPoint', Math.max(Number(value) || 0, 0));
  }

  updateParent(value: string): void {
    this.updateForm('parentId', value === '' ? '' : Number(value));
  }

  updateFilter<K extends keyof CategoryFilters>(key: K, value: CategoryFilters[K]): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadCategories();
  }

  resetFilters(): void {
    this.filters.set({ active: '', parentId: '' });
    this.currentPage.set(1);
    this.openDropdown.set(null);
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
        this.alertService.success(isActive ? 'Đã tạm ngưng danh mục.' : 'Đã kích hoạt danh mục.');
        this.loadCategories();
      },
      error: () => this.alertService.error('Không thể cập nhật trạng thái danh mục.'),
    });
  }

  async deleteCategory(category: CategoryResponse): Promise<void> {
    const confirmed = await this.confirmService.warning(
      'Xóa danh mục',
      `Hệ thống sẽ tự tạm ngừng danh mục "${category.name}".`,
      'Xóa',
    );

    if (!confirmed) {
      return;
    }

    this.masterDataService.deleteCategory(category.id).subscribe({
      next: () => {
        this.alertService.success('Đã xử lý xóa danh mục.');
        this.loadCategories();
      },
      error: () => this.alertService.error('Không thể xóa danh mục này.'),
    });
  }

  getStatusFilterLabel(): string {
    return (
      this.statusFilterOptions.find((option) => option.value === this.filters().active)?.label ||
      'Tất cả'
    );
  }

  getParentFilterLabel(): string {
    const parentId = this.filters().parentId;
    if (parentId === '') {
      return 'Tất cả danh mục cấp 1';
    }

    return (
      this.levelOneCategories().find((category) => category.id === parentId)?.name ||
      'Danh mục đã chọn'
    );
  }

  getParentFormLabel(): string {
    const parentId = this.form().parentId;
    if (parentId === '') {
      return 'Danh mục gốc';
    }

    return (
      this.parentOptions().find((category) => category.id === parentId)?.name || 'Danh mục đã chọn'
    );
  }

  getActiveFormLabel(): string {
    return this.form().isActive ? 'Đang hoạt động' : 'Tạm ngưng';
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
    return node.code || ' ';
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
    const totalPages = Math.max(Math.ceil(this.categories().length / this.pageSize()), 1);
    if (this.currentPage() > totalPages) {
      this.currentPage.set(totalPages);
    }
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
