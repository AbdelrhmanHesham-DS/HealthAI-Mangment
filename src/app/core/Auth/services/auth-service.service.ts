import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export type Role = 'admin' | 'doctor' | 'patient';

export interface AuthUser {
  _id: string;
  id: string;
  email: string;
  role: Role;
  name: string;
  avatar?: string;
  phone?: string;
  // Patient fields
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  // Doctor fields
  specialty?: string;
  experience?: number;
  bio?: string;
  education?: string[];
  languages?: string[];
  certificateUrl?: string;
  idDocument?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approved?: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:3000/api/auth';
  private readonly PROFILE_API = 'http://localhost:3000/api/profile';
  private readonly STORAGE_KEY = 'health_ai_token';
  private readonly USER_KEY = 'health_ai_user';

  private http = inject(HttpClient);
  private router = inject(Router);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(this.STORAGE_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  register(name: string, email: string, password: string, role: Role = 'patient', phone: string = '', extra: any = {}): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, { name, email, password, role, phone, ...extra }).pipe(
      tap(res => {
        localStorage.setItem(this.STORAGE_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  get currentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: Role): boolean {
    return !!this.currentUser && this.currentUser.role === role;
  }

  redirectByRole(): void {
    const role = this.currentUser?.role;
    if (role === 'admin')        this.router.navigate(['/health/admin']);
    else if (role === 'doctor')  this.router.navigate(['/doctor']);
    else                         this.router.navigate(['/health/dashboard']);
  }

  getMe(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.PROFILE_API}`);
  }

  updateMe(data: Partial<AuthUser>): Observable<any> {
    return this.http.put<any>(`${this.PROFILE_API}`, data).pipe(
      tap(response => {
        const user = response.user || response;
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<any>(`${this.API}/upload-avatar`, formData).pipe(
      tap(response => {
        if (response.user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        }
      })
    );
  }

  uploadIdDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('idDocument', file);
    return this.http.post<any>(`${this.API}/upload-id-document`, formData).pipe(
      tap(response => {
        if (response.user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/change-password`, { currentPassword, newPassword });
  }
}
