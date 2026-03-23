import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfo } from 'interface';

@Component({
  selector: 'app-view-user-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-user-modal.component.html',
  styleUrls: ['./view-user-modal.component.scss']
})
export class ViewUserModalComponent {
  @Input() isOpen = false;
  @Input() user: UserInfo | null = null;
  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}
