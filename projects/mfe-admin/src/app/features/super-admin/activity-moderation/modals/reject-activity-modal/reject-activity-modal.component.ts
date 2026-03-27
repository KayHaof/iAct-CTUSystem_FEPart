import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reject-activity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reject-activity-modal.component.html',
})
export class RejectActivityModalComponent {
  activityName = input.required<string>();
  confirm = output<string>();
  modalClosed = output<void>();

  rejectReason = signal('');

  onConfirm(): void {
    const reason = this.rejectReason().trim();
    if (reason) {
      this.confirm.emit(reason);
    }
  }

  onCancel(): void {
    this.modalClosed.emit();
  }
}
