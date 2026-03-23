import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserInfo, Department, MajorInfo, ClassInfo, ApiResponse, PageDTO } from 'interface';
import { TableContainerComponent, PaginationComponent } from '@my-mfe/ui';
import { AlertService } from '@my-mfe/ui';
import Swal from 'sweetalert2';

import { AdminUserService } from '../services/admin-user.service';
import { AddUserModalComponent } from './add-user-modal/add-user-modal.component';
import { ViewUserModalComponent } from './view-user-modal/view-user-modal.component';
import { EditUserModalComponent } from './edit-user-modal/edit-user-modal.component';

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
})
export class UserManagementComponent implements OnInit {
  private adminUserService = inject(AdminUserService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  users = signal<UserInfo[]>([]);
  departments = signal<Department[]>([]);
  isLoading = signal<boolean>(false);
  activeTab = signal<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT');

  studentCount = signal<number>(0);
  facultyCount = signal<number>(0);
  adminCount = signal<number>(0);

  sortBy = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  isEditModalOpen = signal<boolean>(false);
  editingUser = signal<UserInfo | null>(null);
  isSavingClass = signal<boolean>(false);

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalRows = signal<number>(0);

  searchTerm = signal<string>('');
  selectedFaculty = signal<number | ''>(''); // Dùng cho tab Khoa/Đơn vị
  selectedStatus = signal<number | ''>('');

  totalPages = computed(() => Math.ceil(this.totalRows() / this.pageSize()));

  isViewModalOpen = signal<boolean>(false);
  viewingUser = signal<UserInfo | null>(null);

  isAddModalOpen = signal(false);

  // --- BỘ BIẾN LỌC KHOAN SÂU DÀNH CHO TAB SINH VIÊN ---
  cohorts = [
    { label: 'K46 (2020)', value: '46' },
    { label: 'K47 (2021)', value: '47' },
    { label: 'K48 (2022)', value: '48' },
    { label: 'K49 (2023)', value: '49' },
    { label: 'K50 (2024)', value: '50' },
    { label: 'K51 (2025)', value: '51' },
    { label: 'K52 (2026)', value: '52' },
  ];
  selectedFilterCohort = signal<string>('');
  selectedFilterDept = signal<number | ''>('');
  selectedFilterMajor = signal<number | ''>('');
  selectedFilterClass = signal<number | ''>('');

  filterMajors = signal<MajorInfo[]>([]);
  filterClasses = signal<ClassInfo[]>([]);

  ngOnInit() {
    this.loadDepartments();
    this.loadCounts();
    this.loadUsers();
  }

  switchTab(tab: 'STUDENT' | 'FACULTY' | 'ADMIN') {
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
      next: (res: ApiResponse<Department[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as Department[] | { data?: Department[] };
          const deptList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.departments.set(deptList || []);
        }
      },
    });
  }

  loadCounts() {
    this.adminUserService.getUserCounts(this.searchTerm()).subscribe({
      next: (res) => {
        if (res.result) {
          if (this.activeTab() !== 'FACULTY') {
            this.facultyCount.set(res.result.faculty || 0);
          }
          if (this.activeTab() !== 'ADMIN') {
            this.adminCount.set(res.result.admin || 0);
          }
          if (this.activeTab() !== 'STUDENT') {
            this.studentCount.set(res.result.student || 0);
          }
        }
      },
    });
  }

  // --- LOGIC CASCADING DROPDOWN TÌM KIẾM SINH VIÊN ---
  onSearchInputChanged(value: string) {
    // Nếu xóa sạch ô search VÀ chưa chọn lớp -> Reset mọi thứ, đóng băng bảng
    if (this.activeTab() === 'STUDENT' && !value.trim() && !this.selectedFilterClass()) {
      this.users.set([]);
      this.totalRows.set(0);
      this.studentCount.set(0); // Reset số đếm luôn
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
        const safeResult = res.result as any;
        this.filterMajors.set(Array.isArray(safeResult) ? safeResult : safeResult.data || []);
      },
    });
  }

  onFilterMajorChange() {
    this.selectedFilterClass.set('');
    const majorId = this.selectedFilterMajor();
    const academicYear = this.selectedFilterCohort(); // Lấy giá trị '48', '49'

    if (!majorId || !academicYear) {
      this.filterClasses.set([]);
      return;
    }
    this.adminUserService.getClassesByMajor(Number(majorId), academicYear).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        const safeResult = res.result as any;
        this.filterClasses.set(Array.isArray(safeResult) ? safeResult : safeResult.data || []);
      },
    });
  }

  loadUsers() {
    if (
      this.activeTab() === 'STUDENT' &&
      !this.selectedFilterClass() &&
      !this.searchTerm().trim()
    ) {
      this.users.set([]);
      this.totalRows.set(0);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    let currentRole: number;
    if (this.activeTab() === 'STUDENT') currentRole = 1;
    else if (this.activeTab() === 'FACULTY') currentRole = 2;
    else currentRole = 3;

    const apiPage = this.currentPage() - 1;

    // Truyền classId vào API nếu đang tìm sinh viên
    this.adminUserService
      .getUsers(
        apiPage,
        this.pageSize(),
        this.searchTerm(),
        currentRole,
        this.selectedFaculty(),
        this.selectedStatus(),
        this.selectedFilterClass(), // Cần bổ sung tham số này trong file service
      )
      .subscribe({
        next: (res: ApiResponse<PageDTO<UserInfo>>) => {
          let listUsers: UserInfo[] = [];
          let total = 0;
          type FlexibleResponse =
            | {
                result?:
                  | { data?: UserInfo[]; totalRows?: number; totalElements?: number }
                  | UserInfo[];
                data?: UserInfo[];
                totalRows?: number;
                totalElements?: number;
              }
            | UserInfo[];
          const safeRes = res as unknown as FlexibleResponse;

          if (
            safeRes &&
            !Array.isArray(safeRes) &&
            safeRes.result &&
            !Array.isArray(safeRes.result) &&
            safeRes.result.data
          ) {
            listUsers = safeRes.result.data;
            total = safeRes.result.totalRows ?? safeRes.result.totalElements ?? 0;
          } else if (safeRes && !Array.isArray(safeRes) && safeRes.data) {
            listUsers = safeRes.data;
            total = safeRes.totalRows ?? safeRes.totalElements ?? 0;
          } else if (safeRes && !Array.isArray(safeRes) && Array.isArray(safeRes.result)) {
            listUsers = safeRes.result;
            total = safeRes.result.length;
          } else if (Array.isArray(safeRes)) {
            listUsers = listUsers = safeRes;
            total = safeRes.length;
          }

          this.users.set(listUsers);
          this.totalRows.set(total);

          if (this.activeTab() === 'STUDENT') this.studentCount.set(total);
          else if (this.activeTab() === 'FACULTY') this.facultyCount.set(total);
          else if (this.activeTab() === 'ADMIN') this.adminCount.set(total);

          this.isLoading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.totalRows.set(0);
          if (this.activeTab() === 'STUDENT') this.studentCount.set(0);
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

    // Reset bộ lọc sinh viên
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

  onSort(columnName: string) {
    if (this.sortBy() === columnName) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(columnName);
      this.sortDirection.set('asc');
    }
  }

  toggleStatus(user: UserInfo) {
    const newStatus = user.status === 1 ? 0 : 1;
    const actionTxt = newStatus === 1 ? 'mở khóa' : 'khóa';

    Swal.fire({
      title: `Xác nhận ${actionTxt}?`,
      text: `Bạn có chắc muốn ${actionTxt} tài khoản ${user.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus === 1 ? '#10b981' : '#ef4444',
      cancelButtonText: 'Hủy',
      confirmButtonText: `Đồng ý ${actionTxt}`,
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminUserService.toggleUserStatus(user.id, newStatus).subscribe({
          next: () => {
            void Swal.fire('Thành công!', `Đã ${actionTxt} tài khoản.`, 'success');
            this.loadUsers();
          },
          error: () => {
            void Swal.fire('Lỗi!', 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
            this.loadUsers();
          },
        });
      } else {
        this.loadUsers();
      }
    });
  }

  goToImportPage() {
    this.router.navigate(['/admin/user-management/import-users']);
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
    const updatePayload = { classId: classId };

    this.adminUserService.updateProfile(user.id, updatePayload).subscribe({
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
      text: `Hệ thống sẽ gửi một Email chứa liên kết đặt lại mật khẩu an toàn đến địa chỉ: ${user.email}. Bạn có chắc chắn không?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Gửi Email ngay',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        void Swal.fire({
          title: 'Đang gửi Email...',
          text: 'Vui lòng đợi trong giây lát.',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        this.adminUserService.resetPassword(user.id).subscribe({
          next: () => {
            void Swal.fire({
              icon: 'success',
              title: 'Đã gửi Email!',
              html: `Vui lòng thông báo người dùng kiểm tra hộp thư đến (hoặc thư rác) tại <b>${user.email}</b> để đặt lại mật khẩu.`,
            });
          },
          error: () => {
            void Swal.fire('Gửi thất bại', 'Hệ thống không thể gửi email lúc này.', 'error');
          },
        });
      }
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
    departmentId?: number | null;
    description?: string;
  }) {
    const nameParts = newUserData.fullName.trim().split(' ');
    const firstNameToSend = nameParts[0];
    const lastNameToSend = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const payload = {
      username: newUserData.username,
      email: newUserData.email,
      firstName: firstNameToSend,
      lastName: lastNameToSend,
      password: newUserData.password,
      roleType: newUserData.roleType,
      studentCode: newUserData.studentCode,
      classId: newUserData.classId,
      departmentId: newUserData.departmentId,
      description: newUserData.description,
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
}
