import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiResponse, NotificationPreferenceSettings } from '@my-mfe/interface';
import { IACT_API_ORIGIN } from '@my-mfe/ui';

interface PreferenceResponse {
  id?: number;
  userId?: number;
  notificationSettings?: NotificationPreferenceSettings;
}

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
})
export class PreferencesComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly apiOrigin = inject(IACT_API_ORIGIN);

  private readonly apiUrl = `${this.apiOrigin}/user/api/v1`;
  private readonly defaultNotificationSettings: Required<NotificationPreferenceSettings> = {
    newActivityAlert: true,
    reminderAlert: true,
    reminderDaysBefore: 1,
  };

  notifSettings = signal<NotificationPreferenceSettings>({ ...this.defaultNotificationSettings });
  isSaving = signal(false);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.http.get<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences`).subscribe({
      next: (res) => {
        this.notifSettings.set({
          ...this.defaultNotificationSettings,
          ...(res.data?.notificationSettings || {}),
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  notificationSettings(): Required<NotificationPreferenceSettings> {
    return {
      ...this.defaultNotificationSettings,
      ...this.notifSettings(),
    };
  }

  updateNotif(key: 'newActivityAlert' | 'reminderAlert', event: Event): void {
    this.notifSettings.set({
      ...this.notificationSettings(),
      [key]: (event.target as HTMLInputElement).checked,
    });
  }

  updateReminderDays(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const reminderDaysBefore = Number.isFinite(value)
      ? Math.min(Math.max(Math.trunc(value), 1), 14)
      : 1;

    this.notifSettings.set({
      ...this.notificationSettings(),
      reminderDaysBefore,
    });
  }

  savePreferences(): void {
    this.isSaving.set(true);
    const payload = {
      notificationSettings: this.notificationSettings(),
    };
    this.http
      .put<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences`, payload)
      .subscribe({
        next: (res) => {
          this.notifSettings.set({
            ...this.defaultNotificationSettings,
            ...(res.data?.notificationSettings || payload.notificationSettings),
          });
          this.isSaving.set(false);
        },
        error: () => this.isSaving.set(false),
      });
  }

  resetNotificationDefaults(): void {
    this.notifSettings.set({ ...this.defaultNotificationSettings });
    this.savePreferences();
  }
}
