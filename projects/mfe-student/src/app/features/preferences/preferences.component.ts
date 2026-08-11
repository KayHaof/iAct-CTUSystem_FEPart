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

type PreferenceSaveState = 'idle' | 'success' | 'error';

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
  hasLoadError = signal(false);
  saveState = signal<PreferenceSaveState>('idle');

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
        this.hasLoadError.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasLoadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  notificationSettings(): Required<NotificationPreferenceSettings> {
    return {
      ...this.defaultNotificationSettings,
      ...this.notifSettings(),
    };
  }

  updateNotif(key: 'newActivityAlert' | 'reminderAlert', event: Event): void {
    this.saveState.set('idle');
    this.notifSettings.set({
      ...this.notificationSettings(),
      [key]: (event.target as HTMLInputElement).checked,
    });
  }

  updateReminderDays(event: Event): void {
    this.saveState.set('idle');
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
    if (this.isLoading() || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.saveState.set('idle');
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
          this.hasLoadError.set(false);
          this.saveState.set('success');
          this.isSaving.set(false);
        },
        error: () => {
          this.saveState.set('error');
          this.isSaving.set(false);
        },
      });
  }

  resetNotificationDefaults(): void {
    this.saveState.set('idle');
    this.notifSettings.set({ ...this.defaultNotificationSettings });
    this.savePreferences();
  }
}
