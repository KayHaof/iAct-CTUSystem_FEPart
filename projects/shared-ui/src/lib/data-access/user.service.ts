import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:8080/identity/api/v1/users/my-info';

  currentUser = signal<any>(null);

  getMyInfo() {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((response) => {
        const user = response.result;
        this.currentUser.set(user);
      }),
    );
  }
}
