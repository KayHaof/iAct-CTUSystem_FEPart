import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '@my-mfe/interface';

interface PreferenceResponse {
  id?: number;
  userId?: number;
  categoryRatings?: Record<string, number>;
  categoryEnabled?: Record<string, boolean>;
  preferredCategoryIds?: number[];
  excludedCategories?: string[];
  aiRecommendationEnabled?: boolean;
  notificationSettings?: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    activityReminder?: boolean;
    registrationConfirmation?: boolean;
  };
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

  private baseUrl = 'http://localhost:8080';
  private apiUrl = `${this.baseUrl}/user/api/v1`;

  preference = signal<PreferenceResponse | null>(null);
  categories = signal<{ id: number; name: string; code: string }[]>([]);
  selectedIds = signal<number[]>([]);
  ratings = signal<Record<string, number>>({});
  aiEnabled = signal(true);
  notifSettings = signal<PreferenceResponse['notificationSettings']>({});
  isSaving = signal(false);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadCategories();
    this.loadPreferences();
  }

  loadCategories(): void {
    this.http
      .get<ApiResponse<any[]>>(`${this.baseUrl}/activity/api/v1/categories?active=true`)
      .subscribe({
        next: (res) => {
          const cats = (res.data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code || '',
          }));
          this.categories.set(cats);
        },
      });
  }

  loadPreferences(): void {
    this.http.get<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences`).subscribe({
      next: (res) => {
        const pref = res.data;
        if (pref) {
          this.preference.set(pref);
          this.aiEnabled.set(pref.aiRecommendationEnabled ?? true);
          this.notifSettings.set(pref.notificationSettings || {});
          const enabledIds = pref.preferredCategoryIds || [];
          this.selectedIds.set(enabledIds);
          const ratings: Record<string, number> = {};
          if (pref.categoryRatings) {
            Object.entries(pref.categoryRatings).forEach(([k, v]) => {
              ratings[k] = v;
            });
          }
          this.ratings.set(ratings);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  toggleCategory(id: number): void {
    const ids = this.selectedIds();
    if (ids.includes(id)) {
      this.selectedIds.set(ids.filter((i) => i !== id));
    } else {
      this.selectedIds.set([...ids, id]);
    }
  }

  setRating(id: number, star: number): void {
    const r = { ...this.ratings() };
    r[String(id)] = star;
    this.ratings.set(r);
  }

  toggleAI(event: Event): void {
    this.aiEnabled.set((event.target as HTMLInputElement).checked);
  }

  updateNotif(key: string, event: Event): void {
    const settings = { ...this.notifSettings() };
    (settings as any)[key] = (event.target as HTMLInputElement).checked;
    this.notifSettings.set(settings);
  }

  savePreferences(): void {
    this.isSaving.set(true);
    const ratings: Record<string, number> = {};
    this.selectedIds().forEach((id) => {
      ratings[String(id)] = this.ratings()[String(id)] || 3;
    });
    const payload = {
      preferredCategoryIds: this.selectedIds(),
      categoryRatings: ratings,
      categoryEnabled: Object.fromEntries(this.selectedIds().map((id) => [String(id), true])),
      aiRecommendationEnabled: this.aiEnabled(),
      notificationSettings: this.notifSettings(),
    };
    this.http
      .put<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences`, payload)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
        },
        error: () => this.isSaving.set(false),
      });
  }

  resetToDefault(): void {
    this.http
      .post<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences/reset`, {})
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.preference.set(res.data);
            this.aiEnabled.set(res.data.aiRecommendationEnabled ?? true);
            this.notifSettings.set(res.data.notificationSettings || {});
            this.selectedIds.set(res.data.preferredCategoryIds || []);
            const ratings: Record<string, number> = {};
            if (res.data.categoryRatings) {
              Object.entries(res.data.categoryRatings).forEach(([k, v]) => {
                ratings[k] = v;
              });
            }
            this.ratings.set(ratings);
          }
        },
      });
  }
}
