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
import { UserInfo, toLocalDateInput } from '@my-mfe/interface';
import {
  AlertService,
  ConfirmDialogComponent,
  ConfirmService,
  CustomSelectComponent,
  CustomSelectOption,
  CustomSelectValue,
} from '@my-mfe/ui';
import { ClassResponse } from '../../../shared/models/master-data.model';
import { AdminUserService } from '../../super-admin/services/admin-user.service';
import { MasterDataService } from '../../super-admin/services/master-data.service';
import { ClassRepresentative, ClassRepresentativeService } from './class-representative.service';

@Component({
  selector: 'app-class-representative-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, CustomSelectComponent],
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
  readonly representativeTypeOptions: CustomSelectOption[] = [
    {
      label: 'Lớp trưởng',
      value: 'CLASS_MONITOR',
      description: 'Đại diện chính của lớp',
      icon: 'bi-person-badge',
    },
    {
      label: 'Bí thư chi đoàn',
      value: 'SECRETARY',
      description: 'Phụ trách hoạt động chi đoàn',
      icon: 'bi-patch-check',
    },
    {
      label: 'Phó Bí thư chi đoàn',
      value: 'DEPUTY_SECRETARY',
      description: 'Hỗ trợ Bí thư chi đoàn',
      icon: 'bi-person-check',
    },
    {
      label: 'Ban cán sự',
      value: 'ASSISTANT',
      description: 'Thành viên ban cán sự lớp',
      icon: 'bi-people',
    },
    {
      label: 'Đại diện lớp',
      value: 'CLASS_REPRESENTATIVE',
      description: 'Được ủy quyền thao tác hoạt động',
      icon: 'bi-person-lines-fill',
    },
  ];
  readonly activeFilterOptions: CustomSelectOption[] = [
    {
      label: 'Đang hiệu lực',
      value: 'true',
      description: 'Chỉ hiển thị đại diện đang hoạt động',
      icon: 'bi-check2-circle',
    },
    {
      label: 'Tất cả trạng thái',
      value: '',
      description: 'Không giới hạn trạng thái',
      icon: 'bi-ui-checks-grid',
    },
    {
      label: 'Đã ngưng',
      value: 'false',
      description: 'Đại diện đã bị ngưng quyền',
      icon: 'bi-pause-circle',
    },
  ];

  readonly manageableClasses = computed(() => {
    const user = this.userService.currentUser();
    return this.classes().filter((cls) => cls.departmentId === user?.departmentId);
  });
  readonly createClassOptions = computed<CustomSelectOption[]>(() =>
    this.toClassSelectOptions(this.manageableClasses(), 'Chọn lớp'),
  );
  readonly filterClassOptions = computed<CustomSelectOption[]>(() =>
    this.toClassSelectOptions(this.manageableClasses(), 'Tất cả lớp', ''),
  );
  readonly studentOptions = computed<CustomSelectOption[]>(() => [
    {
      label: 'Chọn sinh viên',
      value: null,
      description: this.form.classId ? 'Chọn sinh viên trong lớp' : 'Chọn lớp trước',
      icon: 'bi-person',
      disabled: !this.form.classId,
    },
    ...this.students().map((student) => ({
      label: student.fullName || student.username || 'Sinh viên',
      value: student.id,
      description: student.studentCode || student.username || 'Chưa có MSSV',
      icon: 'bi-person-badge',
    })),
  ]);

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
    startDate: toLocalDateInput(new Date()),
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

  onFilterClassSelected(classId: CustomSelectValue): void {
    this.selectedClassId.set(typeof classId === 'number' ? classId : '');
  }

  onActiveFilterSelected(active: CustomSelectValue): void {
    this.activeFilter.set(active === 'false' ? 'false' : active === 'true' ? 'true' : '');
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

  private toClassSelectOptions(
    classes: ClassResponse[],
    emptyLabel: string,
    emptyValue: number | '' | null = null,
  ): CustomSelectOption[] {
    return [
      {
        label: emptyLabel,
        value: emptyValue,
        description: 'Không chọn lớp cụ thể',
        icon: 'bi-mortarboard',
      },
      ...classes.map((cls) => ({
        label: `${cls.classCode || 'Lớp'} - ${cls.name}`,
        value: cls.id,
        description: [cls.academicYear, cls.majorName].filter(Boolean).join(' · ') || 'Lớp sinh hoạt',
        icon: 'bi-people',
      })),
    ];
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
