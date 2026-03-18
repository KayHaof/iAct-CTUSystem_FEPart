import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserInfo, Department, ClassInfo, MajorInfo, ApiResponse, PageDTO } from 'interface';
import { TableContainerComponent, PaginationComponent } from '@my-mfe/ui';
import Swal from 'sweetalert2';

import { AdminUserService } from '../services/admin-user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TableContainerComponent, PaginationComponent],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  private adminUserService = inject(AdminUserService);

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

  majors = signal<MajorInfo[]>([]);
  classesForEdit = signal<ClassInfo[]>([]);

  editSelectedDept = signal<number | ''>('');
  editSelectedMajor = signal<number | ''>('');
  editSelectedClass = signal<number | ''>('');

  switchTab(tab: 'STUDENT' | 'FACULTY' | 'ADMIN') {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadUsers();
  }

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalRows = signal<number>(0);

  searchTerm = signal<string>('');
  selectedRole = signal<number | ''>('');
  selectedFaculty = signal<number | ''>('');
  selectedStatus = signal<number | ''>('');

  totalPages = computed(() => Math.ceil(this.totalRows() / this.pageSize()));

  isViewModalOpen = signal<boolean>(false);
  viewingUser = signal<UserInfo | null>(null);

  ngOnInit() {
    this.loadDepartments();
    this.loadCounts();
    this.loadUsers();
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
          this.studentCount.set(res.result.student || 0);
          this.facultyCount.set(res.result.faculty || 0);
          this.adminCount.set(res.result.admin || 0);
        }
      },
    });
  }

  loadUsers() {
    this.isLoading.set(true);

    let currentRole: number;
    if (this.activeTab() === 'STUDENT') currentRole = 1;
    else if (this.activeTab() === 'FACULTY') currentRole = 2;
    else currentRole = 3;

    // FE đếm từ 1, BE đếm từ 0
    const apiPage = this.currentPage() - 1;

    this.adminUserService
      .getUsers(
        apiPage,
        this.pageSize(),
        this.searchTerm(),
        currentRole,
        this.selectedFaculty(),
        this.selectedStatus(),
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
            listUsers = safeRes;
            total = safeRes.length;
          }

          this.users.set(listUsers);
          this.totalRows.set(total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách người dùng:', err);
          this.users.set([]);
          this.totalRows.set(0);
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
    this.selectedRole.set('');
    this.selectedFaculty.set('');
    this.selectedStatus.set('');
    this.onSearch();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  // Sort functions
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

  openAddModal() {
    console.log('Mở modal thêm user');
  }

  openImportModal() {
    console.log('Mở modal import excel');
  }

  editUser(user: UserInfo) {
    this.editingUser.set(user);
    this.isEditModalOpen.set(true);
    this.editSelectedDept.set('');
    this.editSelectedMajor.set('');
    this.editSelectedClass.set('');
    this.majors.set([]);
    this.classesForEdit.set([]);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingUser.set(null);
  }

  onEditDeptChange() {
    const deptId = this.editSelectedDept();
    this.editSelectedMajor.set('');
    this.editSelectedClass.set('');
    this.classesForEdit.set([]);

    if (!deptId) {
      this.majors.set([]);
      return;
    }

    this.adminUserService.getMajorsByDepartment(deptId).subscribe({
      next: (res: ApiResponse<MajorInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as MajorInfo[] | { data?: MajorInfo[] };
          const majorList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.majors.set(majorList || []);
        }
      },
    });
  }

  onEditMajorChange() {
    const majorId = this.editSelectedMajor();
    this.editSelectedClass.set('');

    if (!majorId) {
      this.classesForEdit.set([]);
      return;
    }

    this.adminUserService.getClassesByMajor(majorId).subscribe({
      next: (res: ApiResponse<ClassInfo[]>) => {
        if (res && res.result) {
          const safeResult = res.result as unknown as ClassInfo[] | { data?: ClassInfo[] };
          const classList = Array.isArray(safeResult) ? safeResult : safeResult.data;
          this.classesForEdit.set(classList || []);
        }
      },
    });
  }

  saveUserClass() {
    const user = this.editingUser();
    const classId = this.editSelectedClass();

    if (!user || !classId) return;

    this.isSavingClass.set(true);
    const updatePayload = {
      classId: classId,
    };

    this.adminUserService.updateProfile(user.id, updatePayload).subscribe({
      next: () => {
        void Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã phân lớp cho sinh viên thành công!',
          timer: 1500,
          showConfirmButton: false,
        });

        this.isSavingClass.set(false);
        this.closeEditModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Lỗi phân lớp:', err);
        void Swal.fire('Lỗi', 'Không thể phân lớp, vui lòng kiểm tra lại kết nối.', 'error');
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
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.adminUserService.resetPassword(user.id).subscribe({
          next: () => {
            void Swal.fire({
              icon: 'success',
              title: 'Đã gửi Email!',
              html: `Vui lòng thông báo sinh viên <b>${user.fullName}</b> kiểm tra hộp thư đến (hoặc thư rác) tại <b>${user.email}</b> để đặt lại mật khẩu.`,
            });
          },
          error: (err) => {
            console.error('Lỗi khi gửi mail reset pass:', err);
            void Swal.fire(
              'Gửi thất bại',
              'Hệ thống không thể gửi email lúc này. Vui lòng kiểm tra lại cấu hình Mail Server (SMTP).',
              'error',
            );
          },
        });
      }
    });
  }
}
