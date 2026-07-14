import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '@my-mfe/auth';
import { UserInfo } from '@my-mfe/interface';
import { AlertService, ConfirmDialogComponent, ConfirmService } from '@my-mfe/ui';
import { ClassResponse } from '../../../shared/models/master-data.model';
import { AdminUserService } from '../../super-admin/services/admin-user.service';
import { MasterDataService } from '../../super-admin/services/master-data.service';
import { ClassRepresentative, ClassRepresentativeService } from './class-representative.service';

@Component({
  selector: 'app-class-representative-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './class-representative-management.component.html',
  styleUrl: './class-representative-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassRepresentativeManagementComponent implements OnInit {
  private readonly representativeService = inject(ClassRepresentativeService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly userService = inject(UserService);
  private readonly alertService = inject(AlertService);
  private readonly confirmService = inject(ConfirmService);

  readonly representatives = signal<ClassRepresentative[]>([]);
  readonly classes = signal<ClassResponse[]>([]);
  readonly students = signal<UserInfo[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly keyword = signal('');
  readonly selectedClassId = signal<number | ''>('');
  readonly activeFilter = signal<'true' | 'false' | ''>('true');
  readonly isDepartmentManager = computed(() => this.userService.currentUser()?.roleType === 2);
  readonly activeCount = computed(
    () => this.representatives().filter((representative) => representative.isActive).length,
  );

  readonly manageableClasses = computed(() => {
    const user = this.userService.currentUser();
    return this.classes().filter((cls) => cls.departmentId === user?.departmentId);
  });

  form: {
    classId: number | null;
    studentId: number | null;
    representativeType: string;
    startDate: string;
    endDate: string;
  } = {
    classId: null,
    studentId: null,
    representativeType: 'CLASS_MONITOR',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  };

  ngOnInit(): void {
    if (!this.isDepartmentManager()) return;
    this.loadClasses();
    this.loadRepresentatives();
  }

  loadRepresentatives(): void {
    const user = this.userService.currentUser();
    this.isLoading.set(true);
    this.representativeService
      .getRepresentatives({
        departmentId: user?.departmentId || '',
        classId: this.selectedClassId(),
        active: this.activeFilter(),
        keyword: this.keyword(),
      })
      .subscribe({
        next: (response) => {
          this.representatives.set(response.data || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.representatives.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onClassSelected(classId: number | null): void {
    this.form.classId = classId;
    this.form.studentId = null;
    this.students.set([]);
    this.loadStudentsForSelectedClass();
  }

  loadStudentsForSelectedClass(): void {
    if (!this.form.classId) return;
    this.adminUserService.getUsers(1, 100, '', 1, '', 1, this.form.classId).subscribe({
      next: (response) => this.students.set(response.data?.data || []),
      error: () => this.students.set([]),
    });
  }

  async createRepresentative(): Promise<void> {
    if (this.isSaving()) return;
    if (!this.form.classId || !this.form.studentId) {
      this.alertService.error('Vui lòng chọn lớp và sinh viên đại diện.');
      return;
    }

    const selectedStudent = this.students().find((student) => student.id === this.form.studentId);
    const selectedClass = this.manageableClasses().find((cls) => cls.id === this.form.classId);
    const representativeType = this.representativeLabel(this.form.representativeType);

    try {
      await this.confirmService.confirm({
        title: 'Gán đại diện lớp?',
        message:
          `Xác nhận gán ${selectedStudent?.fullName || selectedStudent?.username || 'sinh viên này'} ` +
          `làm ${representativeType.toLowerCase()} cho lớp ${selectedClass?.classCode || selectedClass?.name || 'đã chọn'}.`,
        confirmText: 'Gán đại diện',
        cancelText: 'Hủy',
        type: 'info',
      });
    } catch {
      return;
    }

    this.isSaving.set(true);
    this.representativeService
      .createRepresentative({
        classId: this.form.classId,
        studentId: this.form.studentId,
        representativeType: this.form.representativeType,
        startDate: this.form.startDate || null,
        endDate: this.form.endDate || null,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.alertService.success('Đã gán đại diện lớp.');
          this.form.studentId = null;
          this.loadStudentsForSelectedClass();
          this.loadRepresentatives();
        },
        error: (error) => {
          this.isSaving.set(false);
          this.alertService.error(error?.error?.message || 'Không thể gán đại diện.');
        },
      });
  }

  async deactivate(rep: ClassRepresentative): Promise<void> {
    if (!rep.isActive) return;

    try {
      await this.confirmService.danger({
        title: 'Ngưng phân quyền đại diện?',
        message:
          `Sinh viên ${rep.studentName || rep.studentCode || 'này'} sẽ không còn quyền đại diện ` +
          `cho lớp ${rep.classCode || rep.className || 'đã chọn'} để đăng ký hoặc theo dõi hoạt động.`,
        confirmText: 'Ngưng phân quyền',
        cancelText: 'Hủy',
      });
    } catch {
      return;
    }

    this.representativeService.deactivateRepresentative(rep.id).subscribe({
      next: () => {
        this.alertService.success('Đã ngưng hiệu lực đại diện.');
        this.loadRepresentatives();
      },
      error: (error) =>
        this.alertService.error(error?.error?.message || 'Không thể ngưng đại diện.'),
    });
  }

  representativeLabel(type?: string): string {
    const labels: Record<string, string> = {
      CLASS_MONITOR: 'Lớp trưởng',
      SECRETARY: 'Bí thư chi đoàn',
      DEPUTY_SECRETARY: 'Phó bí thư chi đoàn',
      ASSISTANT: 'Ban cán sự',
      CLASS_REPRESENTATIVE: 'Đại diện lớp',
    };
    return type ? labels[type] || type : 'Đại diện lớp';
  }

  private loadClasses(): void {
    const user = this.userService.currentUser();
    this.masterDataService
      .getClasses(1, 1000, {
        active: 'true',
        departmentId: user?.departmentId || '',
        majorId: '',
        academicYear: '',
        keyword: '',
      })
      .subscribe({
        next: (response) => this.classes.set(response.data?.data || []),
        error: () => this.classes.set([]),
      });
  }
}
