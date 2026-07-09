import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationFacade } from '../../services/notification-facade.service';
import { NOTIFICATION_TYPE_CONFIG, NotificationType } from '@my-mfe/interface';

@Component({
  selector: 'lib-notification-bell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit {
  readonly facade = inject(NotificationFacade);
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.facade.init();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.facade.dropdownOpen() &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.facade.closeDropdown();
    }
  }

  getTypeConfig(type: NotificationType) {
    return NOTIFICATION_TYPE_CONFIG[type] ?? NOTIFICATION_TYPE_CONFIG[2];
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
