import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService, PaginationComponent, TableContainerComponent } from '@my-mfe/ui';
import { ApiResponse, ClassInfo, Department, MajorInfo, PageDTO, UserInfo } from 'interface';
import Swal from 'sweetalert2';

import { AdminUserService } from '../services/admin-user.service';
import { AddUserModalComponent } from './add-user-modal/add-user-modal.component';
import { EditUserModalComponent } from './edit-user-modal/edit-user-modal.component';
import { ViewUserModalComponent } from './view-user-modal/view-user-modal.component';

type UserTab = 'STUDENT' | 'FACULTY' | 'ADMIN';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableContainerComponent,
    PaginationComponent,
    AddUserModalComponent,
    ViewUserModalComponent,
    EditUserModalComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private adminUserService = inject(AdminUserService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  users = signal<UserInfo[]>([]);
  departments = signal<Department[]>([]);
  isLoading = signal(false);
  activeTab = signal<UserTab>('STUDENT');

  studentCount = signal(0);
  facultyCount = signal(0);
  adminCount = signal(0);

  sortBy = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  isEditModalOpen = signal(false);
  editingUser = signal<UserInfo | null>(null);
  isSavingClass = signal(false);

  currentPage = signal(1);
  pageSize = signal(10);
  totalRows = signal(0);
  totalPages = computed(() => Math.ceil(this.totalRows() / this.pageSize()));

  searchTerm = signal('');
  selectedFaculty = signal<number | ''>('');
  selectedStatus = signal<number | ''>('');

  isViewModalOpen = signal(false);
  viewingUser = signal<UserInfo | null>(null);
  isAddModalOpen = signal(false);

  cohorts = [
    { label: 'K46 (2020)', value: '46' },
    { label: 'K47 (2021)', value: '47' },
    { label: 'K48 (2022)', value: '48' },
    { label: 'K49 (2023)', value: '49' },
    { label: 'K50 (2024)', value: '50' },
    { label: 'K51 (2025)', value: '51' },
    { label: 'K52 (2026)', value: '52' },
  ];
  selectedFilterCohort = signal('');
  selectedFilterDept = signal<number | ''>('');
  selectedFilterMajor = signal<number | ''>('');
  selectedFilterClass = signal<number | ''>('');

  filterMajors = signal<MajorInfo[]>([]);
  filterClasses = signal<ClassInfo[]>([]);

  sortedUsers = computed(() => {
    const data = [...this.users()];
    const col = this.sortBy();
    const dir = this.sortDirection();

    if (!col) return data;

    return data.sort((a, b) => {
      const valA =
        col === 'studentCode' ? a.studentCode || a.username || '' : a[col as keyof UserInfo];
      const valB =
        col === 'studentCode' ? b.studentCode || b.username || '' : b[col as keyof UserInfo];

      const strA = valA ? String(valA).toLowerCase() : '';
      const strB = valB ? String(valB).toLowerCase() : '';

      if (strA < strB) return dir === 'asc' ? -1 : 1;
      if (strA > strB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  ngOnInit() {
    this.loadDepartments();
    this.loadCounts();
    this.loadUsers();
  }

  switchTab(tab: UserTab) {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadUsers();
  }

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
  }

  loadDepartments() {
    this.adminUserService.getAllDepartments().subscribe({
      next: (res: ApiResponse<PageDTO<Department>>) => {
        this.departments.set(res?.result?.data || []);
      },
    });
  }

  loadCounts() {
    this.adminUserService.getUserCounts(this.searchTerm()).subscribe({
      next: (res) => {
        if (!res.result) return;
        this.studentCount.set(res.result.student || 0);
        this.facultyCount.set(res.result.faculty || 0);
        this.adminCount.set(res.result.admin || 0);
      },
    });
  }

  onSearchInputChanged(value: string) {
    if (
      this.activeTab() === 'STUDENT' &&
      !value.trim() &&
      !this.selectedFilterClass() &&
      this.selectedStatus() === ''
    ) {
      this.users.set([]);
      this.totalRows.set(0);
      this.studentCount.set(0);
      this.isLoading.set(false);
    }
  }

  onFilterCohortChange() {
    this.selectedFilterDept.set('');
    this.selectedFilterMajor.set('');
    this.selectedFilterClass.set('');
    this.filterMajors.set([]);
    this.filterClasses.set([]);
  }

  onFilterDeptChange() {
    this.selectedFilterMajor.set('');
    this.selectedFilterClass.set('');
    this.filterClasses.set([]);

    const deptId = this.selectedFilterDept();
    if (!deptId) {
      this.filterMajors.set([]);
      return;
    }

    this.adminUserService.getMajorsByDepartment(Number(deptId)).subscribe({
      next: (res: ApiResponse<MajorInfo[]>) => {
        const result = res.result as unknown as MajorInfo[] | { data?: MajorInfo[] };
        this.filterMajors.set(Array.isArray(result) ? result : result?.data || []);
      },
    });
  }

  onFilterMajorChange() {
    this.selectedFilterClass.set('');
    const majorId = this.selectedFilterMajor();
    const academicYear = this.selectedFilterCohort();

    if (!majorId || !academicYear) {
      this.filterClasses.set([]);
      return;
    }

    this.adminUserService.getClassesByMajor(Number(majorId), academicYear).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        const result = res.result as unknown as ClassInfo[] | { data?: ClassInfo[] };
        this.filterClasses.set(Array.isArray(result) ? result : result?.data || []);
      },
    });
  }

  loadUsers() {
    if (
      this.activeTab() === 'STUDENT' &&
      !this.selectedFilterClass() &&
      !this.searchTerm().trim() &&
      this.selectedStatus() === ''
    ) {
      this.users.set([]);
      this.totalRows.set(0);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.adminUserService
      .getUsers(
        this.currentPage(),
        this.pageSize(),
        this.searchTerm().trim(),
        this.getRoleType(this.activeTab()),
        this.selectedFaculty(),
        this.selectedStatus(),
        this.selectedFilterClass(),
      )
      .subscribe({
        next: (res: ApiResponse<PageDTO<UserInfo>>) => {
          const { data, total } = this.readUserPage(res);
          this.users.set(data);
          this.totalRows.set(total);
          this.updateActiveCount(total);
          this.isLoading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.totalRows.set(0);
          this.updateActiveCount(0);
          this.isLoading.set(false);
        },
      });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadCounts();
    this.loadUsers();
  }

  resetFilters() {
    this.searchTerm.set('');
    this.selectedFaculty.set('');
    this.selectedStatus.set('');
    this.selectedFilterCohort.set('');
    this.selectedFilterDept.set('');
    this.selectedFilterMajor.set('');
    this.selectedFilterClass.set('');
    this.filterMajors.set([]);
    this.filterClasses.set([]);
    this.onSearch();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSort(columnName: string) {
    if (this.sortBy() === columnName) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(columnName);
      this.sortDirection.set('asc');
    }
  }

  toggleStatus(user: UserInfo) {
    const newStatus = this.isActive(user) ? 0 : 1;
    const actionText = newStatus === 1 ? 'mở khóa' : 'khóa';

    Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: `Bạn có chắc muốn ${actionText} tài khoản ${user.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 1 ? '#10b981' : '#ef4444',
      cancelButtonText: 'Hủy',
      confirmButtonText: `Đồng ý ${actionText}`,
    }).then((result) => {
      if (!result.isConfirmed) {
        this.loadUsers();
        return;
      }

      this.adminUserService.toggleUserStatus(user.id, newStatus).subscribe({
        next: () => {
          void Swal.fire('Thành công!', `Đã ${actionText} tài khoản.`, 'success');
          this.loadUsers();
          this.loadCounts();
        },
        error: () => {
          void Swal.fire('Lỗi!', 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
          this.loadUsers();
        },
      });
    });
  }

  goToImportPage() {
    void this.router.navigate(['/admin/user-management/import-users']);
  }

  editUser(user: UserInfo) {
    this.editingUser.set(user);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingUser.set(null);
  }

  handleSaveUserClass(classId: number) {
    const user = this.editingUser();
    if (!user) return;

    this.isSavingClass.set(true);
    this.adminUserService.updateProfile(user.id, { classId }).subscribe({
      next: () => {
        this.alertService.success('Đã phân lớp cho sinh viên thành công!');
        this.isSavingClass.set(false);
        this.closeEditModal();
        this.loadUsers();
      },
      error: () => {
        this.alertService.error('Không thể phân lớp, vui lòng kiểm tra lại kết nối.');
        this.isSavingClass.set(false);
      },
    });
  }

  openViewModal(user: UserInfo) {
    this.viewingUser.set(user);
    this.isViewModalOpen.set(true);
  }

  closeViewModal() {
    this.isViewModalOpen.set(false);
    this.viewingUser.set(null);
  }

  resetPassword(user: UserInfo) {
    Swal.fire({
      title: 'Gửi link đặt lại mật khẩu?',
      text: `Hệ thống sẽ gửi email đặt lại mật khẩu đến ${user.email}. Bạn có chắc chắn không?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Gửi email ngay',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (!result.isConfirmed) return;

      void Swal.fire({
        title: 'Đang gửi email...',
        text: 'Vui lòng đợi trong giây lát.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.adminUserService.resetPassword(user.id).subscribe({
        next: () => {
          void Swal.fire({
            icon: 'success',
            title: 'Đã gửi email!',
            html: `Vui lòng thông báo người dùng kiểm tra hộp thư đến hoặc thư rác tại <b>${user.email}</b>.`,
          });
        },
        error: () => {
          void Swal.fire('Gửi thất bại', 'Hệ thống không thể gửi email lúc này.', 'error');
        },
      });
    });
  }

  handleSaveNewUser(newUserData: {
    username: string;
    email: string;
    fullName: string;
    password?: string;
    roleType: number;
    studentCode?: string;
    classId?: number | null;
    description?: string;
  }) {
    const nameParts = newUserData.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || newUserData.fullName.trim();
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const payload = {
      username: newUserData.username.trim(),
      email: newUserData.email.trim(),
      firstName,
      lastName,
      password: newUserData.password,
      roleType: newUserData.roleType,
      studentCode: newUserData.studentCode?.trim() || undefined,
      classId: newUserData.classId || undefined,
      description: newUserData.description?.trim() || undefined,
    };

    this.adminUserService.registerUser(payload).subscribe({
      next: () => {
        this.alertService.success(`Tạo tài khoản ${payload.username} thành công!`);
        this.closeAddModal();
        this.loadUsers();
        this.loadCounts();
      },
      error: (err) => {
        let errorMsg = 'Có lỗi xảy ra khi tạo người dùng!';
        if (err.error) {
          try {
            const parsedError = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
            errorMsg = parsedError.message || parsedError.error || errorMsg;
          } catch {
            errorMsg = err.error;
          }
        }
        this.alertService.error(errorMsg);
      },
    });
  }

  isActive(user: UserInfo) {
    return user.status === 1;
  }

  roleLabel(roleType?: number) {
    if (roleType === 1) return 'Sinh viên';
    if (roleType === 2) return 'Khoa / đơn vị';
    if (roleType === 3) return 'Quản trị viên';
    return 'Khác';
  }

  private getRoleType(tab: UserTab) {
    if (tab === 'STUDENT') return 1;
    if (tab === 'FACULTY') return 2;
    return 3;
  }

  private updateActiveCount(total: number) {
    if (this.activeTab() === 'STUDENT') this.studentCount.set(total);
    if (this.activeTab() === 'FACULTY') this.facultyCount.set(total);
    if (this.activeTab() === 'ADMIN') this.adminCount.set(total);
  }

  private readUserPage(res: ApiResponse<PageDTO<UserInfo>>) {
    type FlexiblePage = {
      result?: PageDTO<UserInfo> | UserInfo[];
      data?: UserInfo[];
      totalRows?: number;
      totalElements?: number;
    };
    const safeRes = res as unknown as FlexiblePage | UserInfo[];

    if (Array.isArray(safeRes)) {
      return { data: safeRes, total: safeRes.length };
    }

    if (safeRes?.result && !Array.isArray(safeRes.result)) {
      return {
        data: safeRes.result.data || [],
        total: safeRes.result.totalRows ?? safeRes.result.data?.length ?? 0,
      };
    }

    if (safeRes?.result && Array.isArray(safeRes.result)) {
      return { data: safeRes.result, total: safeRes.result.length };
    }

    return {
      data: safeRes?.data || [],
      total: safeRes?.totalRows ?? safeRes?.totalElements ?? safeRes?.data?.length ?? 0,
    };
  }
}
