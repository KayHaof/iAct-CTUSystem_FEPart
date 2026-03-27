import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-reject-reason-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-reject-reason-modal.component.html',
})
export class ViewRejectReasonModalComponent {
  activityName = input<string>('Không xác định');
  reason = input<string>('Không có lý do cụ thể được ghi nhận.');
  modalClosed = output<void>();

  onClose() {
    this.modalClosed.emit();
  }
}
