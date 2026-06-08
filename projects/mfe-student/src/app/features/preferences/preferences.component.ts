import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from 'interface';

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
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-slate-800">Cai dat uu tien</h1>
          <p class="text-slate-500 mt-1">Cau hinh cac tieu chi yeu thich de nhan goi y hoat dong phu hop</p>
        </div>

        <!-- AI Recommendation Toggle -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Goi y tu dong</h2>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              [checked]="aiEnabled()"
              (change)="toggleAI($event)"
              class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <p class="font-medium text-slate-700">Kich hoat goi y AI</p>
              <p class="text-sm text-slate-500">He thong se tu dong goi y hoat dong phu hop voi so thich cua ban</p>
            </div>
          </label>
        </div>

        <!-- Categories Selection -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Tieu chi quan tam</h2>
          <p class="text-sm text-slate-500 mb-4">Chon cac tieu chi ma ban muon nhan thong bao va goi y</p>

          <div class="grid grid-cols-2 gap-3">
            @for (cat of categories(); track cat.id) {
              <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                     [class.border-blue-400]="isSelected(cat.id)"
                     [class.bg-blue-50]="isSelected(cat.id)">
                <input
                  type="checkbox"
                  [checked]="isSelected(cat.id)"
                  (change)="toggleCategory(cat.id)"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div class="flex-1">
                  <p class="font-medium text-slate-700">{{ cat.name }}</p>
                  <p class="text-xs text-slate-400">{{ cat.code }}</p>
                </div>
                @if (isSelected(cat.id) && ratings()[cat.id]) {
                  <div class="flex items-center gap-1">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button
                        (click)="setRating(cat.id, star)"
                        class="text-lg leading-none focus:outline-none"
                        [class.text-yellow-400]="star <= ratings()[cat.id]"
                        [class.text-slate-300]="star > ratings()[cat.id]">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </button>
                    }
                  </div>
                }
              </label>
            }
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">Cai dat thong bao</h2>
          <div class="space-y-4">
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium text-slate-700">Email thong bao</p>
                <p class="text-sm text-slate-500">Nhan thong bao qua email</p>
              </div>
              <input
                type="checkbox"
                [checked]="notifSettings()?.emailEnabled"
                (change)="updateNotif('emailEnabled', $event)"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium text-slate-700">Push thong bao</p>
                <p class="text-sm text-slate-500">Nhan thong bao truc tiep tren trinh duyet</p>
              </div>
              <input
                type="checkbox"
                [checked]="notifSettings()?.pushEnabled"
                (change)="updateNotif('pushEnabled', $event)"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium text-slate-700">Nhac nho hoat dong</p>
                <p class="text-sm text-slate-500">Nhan thong bao truoc khi hoat dong bat dau</p>
              </div>
              <input
                type="checkbox"
                [checked]="notifSettings()?.activityReminder"
                (change)="updateNotif('activityReminder', $event)"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <div>
                <p class="font-medium text-slate-700">Xac nhan dang ky</p>
                <p class="text-sm text-slate-500">Nhan thong bao khi dang ky thanh cong</p>
              </div>
              <input
                type="checkbox"
                [checked]="notifSettings()?.registrationConfirmation"
                (change)="updateNotif('registrationConfirmation', $event)"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <button
            (click)="resetToDefault()"
            [disabled]="isSaving()"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition disabled:opacity-50">
            Khoi phuc mac dinh
          </button>
          <button
            (click)="savePreferences()"
            [disabled]="isSaving()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
            @if (isSaving()) {
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Dang luu...
            } @else {
              Luu thay doi
            }
          </button>
        </div>
      </div>
    </div>
  `,
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
    this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/activity/api/v1/categories?active=true`).subscribe({
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
    this.http.put<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences`, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
    });
  }

  resetToDefault(): void {
    this.http.post<ApiResponse<PreferenceResponse>>(`${this.apiUrl}/student-preferences/reset`, {}).subscribe({
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
