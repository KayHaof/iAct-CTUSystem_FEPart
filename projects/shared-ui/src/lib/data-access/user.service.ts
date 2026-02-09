import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export interface UserInfo {
  id: number;
  keycloakId: string;
  username: string;
  email: string;
  roleType: number; // 1=student, 2=department, 3=admin
  status: number; // 1=active, 0=inactive, 2=locked

  studentCode: string;
  classId?: number;
  departmentId?: number;
  fullName: string;
  birthday?: string;
  gender?: number;
  phone?: string;
  address?: string;

  avtUrl?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/identity/api/v1/users/my-info'; // api lấy in

  currentUser = signal<UserInfo | null>(null);

  getMyInfo() {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((response) => {
        const user = response.result;
        if (user) {
          this.currentUser.set(user);
        }
      }),
    );
  }
}
