import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent {
  private router = inject(Router);

  // Hàm chuyển hướng sang trang tạo mới
  goToCreate() {
    this.router.navigate(['/admin/activities/create']);
    // (Nhớ đổi đường dẫn cho khớp với file route thực tế của ní nha)
  }
}
